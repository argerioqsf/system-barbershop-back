import { Money } from '@/core/domain/value-objects/money'
import { TransactionRunner } from '@/core/application/ports/transaction-runner'
import {
  TransactionRunnerLike,
  normalizeTransactionRunner,
} from '@/core/application/utils/transaction-runner'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepositoryPort } from '@/modules/finance/application/ports/cash-register-repository'
import { IncrementBalanceProfileService } from '@/services/profile/increment-balance'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import { UpdateCashFinalAmountUseCase } from '@/modules/finance/application/use-cases/update-cash-final-amount'
import { UserNotFoundError } from '@/core/application/errors/user-not-found-error'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { NegativeValuesNotAllowedError } from '../errors/negative-values-not-allowed-error'
import { AffectedUserNotFoundError } from '@/services/@errors/transaction/affected-user-not-found-error'
import { AddBalanceDTO, AddBalanceOutput } from '../dto/add-balance.dto'
import { Transaction } from '@prisma/client'
import { TransactionReason } from '../../domain/entities/transaction'

export class AddBalanceUseCase {
  private readonly transactionRunner: TransactionRunner

  constructor(
    private readonly barberUsersRepository: BarberUsersRepository,
    private readonly cashRegisterRepository: CashRegisterRepositoryPort,
    private readonly incrementProfileService: IncrementBalanceProfileService,
    private readonly incrementUnitService: IncrementBalanceUnitService,
    private readonly updateCashRegisterFinalAmount: UpdateCashFinalAmountUseCase,
    transactionRunner?: TransactionRunnerLike,
  ) {
    this.transactionRunner = normalizeTransactionRunner(
      transactionRunner,
      defaultTransactionRunner,
    )
  }

  async execute(command: AddBalanceDTO): Promise<AddBalanceOutput> {
    const actor = await this.barberUsersRepository.findById(command.actorId)
    if (!actor) {
      throw new UserNotFoundError()
    }

    const session = await this.cashRegisterRepository.findOpenByUnit(
      command.unitId,
    )
    if (!session) {
      throw new CashRegisterClosedError()
    }

    const additionAmount = command.amount
    if (additionAmount.isNegative() || additionAmount.isZero()) {
      throw new NegativeValuesNotAllowedError()
    }

    const transactions = await this.transactionRunner.run(async (tx) => {
      const collected: Transaction[] = []
      const additionAmountValue = additionAmount.toNumber()
      const baseReason = command.reason

      if (command.affectedUserId) {
        const affectedUser = await this.barberUsersRepository.findById(
          command.affectedUserId,
        )

        if (!affectedUser) {
          throw new AffectedUserNotFoundError()
        }

        const balance = Money.from(affectedUser.profile?.totalBalance ?? 0)

        if (balance.isNegative()) {
          const debtAmount = balance.negate()
          const amountToPayDebt = additionAmount.lessThan(debtAmount)
            ? additionAmount
            : debtAmount

          if (!amountToPayDebt.isZero()) {
            const profileTx = await this.incrementProfileService.execute(
              affectedUser.id,
              amountToPayDebt.toNumber(),
              {
                reason: TransactionReason.PAY_LOAN,
                tx,
                userId: command.actorId,
              },
              undefined,
              true,
              `Debt payment: ${command.description}`,
              undefined,
              undefined,
              undefined,
            )
            collected.push(profileTx.transaction)

            const unitTx = await this.incrementUnitService.execute(
              affectedUser.unitId,
              affectedUser.id,
              amountToPayDebt.toNumber(),
              { reason: TransactionReason.PAY_LOAN, tx },
              undefined,
              true,
              undefined,
              `Debt payment received: ${command.description}`,
            )
            collected.push(unitTx.transaction)
          }

          const remaining = additionAmount.subtract(amountToPayDebt)

          if (!remaining.isZero()) {
            const profileTx = await this.incrementProfileService.execute(
              affectedUser.id,
              remaining.toNumber(),
              { reason: baseReason, tx, userId: command.actorId },
              undefined,
              false,
              command.description,
              undefined,
              undefined,
              undefined,
            )
            collected.push(profileTx.transaction)
          }
        } else {
          const profileTx = await this.incrementProfileService.execute(
            affectedUser.id,
            additionAmountValue,
            { reason: baseReason, tx, userId: command.actorId },
            undefined,
            false,
            command.description,
            undefined,
            undefined,
            undefined,
          )
          collected.push(profileTx.transaction)
        }
      } else {
        const unitTx = await this.incrementUnitService.execute(
          command.unitId,
          command.actorId,
          additionAmountValue,
          { reason: baseReason, tx },
          undefined,
          false,
          undefined,
          command.description,
        )
        collected.push(unitTx.transaction)
      }

      await this.updateCashRegisterFinalAmount.execute(
        { sessionId: session.id, amount: additionAmount },
        tx,
      )

      return collected
    })

    return { transactions }
  }
}
