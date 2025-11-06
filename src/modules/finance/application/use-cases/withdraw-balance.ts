import {
  BarberUsersRepository,
  UserFindById,
} from '@/repositories/barber-users-repository'
import {
  CashRegisterRepositoryPort,
  CashSessionRecord,
} from '@/modules/finance/application/ports/cash-register-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { PayUserLoansUseCase } from '@/modules/finance/application/use-cases/pay-user-loans'
import { UpdateCashFinalAmountUseCase } from '@/modules/finance/application/use-cases/update-cash-final-amount'
import { IncrementBalanceUnitService } from '@/services/unit/increment-balance'
import { logger } from '@/lib/logger'
import { Money } from '@/core/domain/value-objects/money'
import { Prisma, Transaction } from '@prisma/client'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { UnitNotFoundError } from '@/services/@errors/unit/unit-not-found-error'
import { InsufficientBalanceError } from '@/services/@errors/transaction/insufficient-balance-error'
import { NegativeValuesNotAllowedError } from '../errors/negative-values-not-allowed-error'
import { AffectedUserNotFoundError } from '@/services/@errors/transaction/affected-user-not-found-error'
import { AmountsUserInconsistentError } from '@/services/@errors/user/amounts-user-inconsistent'
import { UserNotFromUnitError } from '@/services/@errors/user/user-not-from-unir-error'
import { TransactionRunner } from '@/core/application/ports/transaction-runner'
import {
  TransactionRunnerLike,
  normalizeTransactionRunner,
} from '@/core/application/utils/transaction-runner'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { PayCommissionUseCase } from '@/modules/finance/application/use-cases/pay-commission'
import {
  WithdrawBalanceDTO,
  WithdrawBalanceOutput,
} from '../dto/withdraw-balance.dto'

export class WithdrawBalanceUseCase {
  private readonly transactionRunner: TransactionRunner

  constructor(
    private readonly barberUserRepository: BarberUsersRepository,
    private readonly cashRegisterRepository: CashRegisterRepositoryPort,
    private readonly payCommissionUseCase: PayCommissionUseCase,
    private readonly payLoansUseCase: PayUserLoansUseCase,
    private readonly updateCashRegisterFinalAmount: UpdateCashFinalAmountUseCase,
    private readonly unitRepository: UnitRepository,
    private readonly decrementBalance: IncrementBalanceUnitService,
    transactionRunner?: TransactionRunnerLike,
  ) {
    this.transactionRunner = normalizeTransactionRunner(
      transactionRunner,
      defaultTransactionRunner,
    )
  }

  async execute(command: WithdrawBalanceDTO): Promise<WithdrawBalanceOutput> {
    logger.debug(WithdrawBalanceUseCase.name, {
      actorId: command.actorId,
      unitId: command.unitId,
      affectedUserId: command.affectedUserId,
      amount: command.amount.toNumber(),
      discountLoans: command.discountLoans ?? false,
      reason: command.reason,
    })

    if (command.amount.isNegative()) {
      throw new NegativeValuesNotAllowedError()
    }

    const session = await this.cashRegisterRepository.findOpenByUnit(
      command.unitId,
    )

    if (command.affectedUserId) {
      const affectedUser = await this.barberUserRepository.findById(
        command.affectedUserId,
      )

      if (affectedUser?.unitId !== command.unitId) {
        throw new UserNotFromUnitError()
      }

      const transactions = await this.withdrawFromUser(
        affectedUser,
        session,
        command,
      )

      return { transactions }
    }

    const transactions = await this.withdrawFromUnit(command, session)
    return { transactions }
  }

  private async withdrawFromUnit(
    command: WithdrawBalanceDTO,
    session: CashSessionRecord | null,
  ): Promise<Transaction[]> {
    if (!session) {
      throw new CashRegisterClosedError()
    }

    const unit = await this.unitRepository.findById(command.unitId)
    if (!unit) {
      throw new UnitNotFoundError()
    }

    const unitBalance = Money.from(unit.totalBalance ?? 0)
    const amountToWithdraw = command.amount

    logger.debug(
      'checks that the amount to be paid is not greater than the unit balance',
      {
        unitBalance: unitBalance.toNumber(),
        amountToWithdraw: amountToWithdraw.toNumber(),
      },
    )

    if (amountToWithdraw.toNumber() > unitBalance.toNumber()) {
      throw new InsufficientBalanceError()
    }

    const result = await this.transactionRunner.run(
      async (tx: Prisma.TransactionClient) => {
        const decrement = await this.decrementBalance.execute(
          command.unitId,
          command.actorId,
          amountToWithdraw.multiply(-1).toNumber(),
          { reason: command.reason, tx },
          undefined,
          undefined,
          undefined,
          command.description,
        )

        logger.debug('updated cash with the value', {
          value: amountToWithdraw.multiply(-1).toNumber(),
        })

        await this.updateCashRegisterFinalAmount.execute(
          {
            sessionId: session.id,
            amount: amountToWithdraw.multiply(-1),
          },
          tx,
        )

        return decrement.transaction
      },
    )

    return [result]
  }

  private async withdrawFromUser(
    affectedUser: UserFindById | null,
    session: CashSessionRecord | null,
    command: WithdrawBalanceDTO,
  ): Promise<Transaction[]> {
    if (!session) {
      throw new CashRegisterClosedError()
    }

    if (!affectedUser) {
      throw new AffectedUserNotFoundError()
    }

    const balanceAffectedUser = Money.from(
      affectedUser.profile?.totalBalance ?? 0,
    )
    logger.debug('total balance of the affected user', {
      totalBalance: balanceAffectedUser.toNumber(),
    })

    const commissionPreview = await this.payCommissionUseCase.preview(
      affectedUser.id,
    )

    const commissionToBePaid = command.amount

    logger.debug('checks the consistency of the commission calculation', {
      totalUserCommission: commissionPreview.total.toNumber(),
      balanceAffectedUser: balanceAffectedUser.toNumber(),
    })

    if (commissionPreview.total.toNumber() !== balanceAffectedUser.toNumber()) {
      throw new AmountsUserInconsistentError()
    }

    logger.debug(
      'checks that the amount to be paid is not greater than the users balance',
      {
        commissionToBePaid: commissionToBePaid.toNumber(),
        balanceAffectedUser: balanceAffectedUser.toNumber(),
      },
    )

    if (commissionToBePaid.toNumber() > balanceAffectedUser.toNumber()) {
      throw new InsufficientBalanceError()
    }

    if (commissionToBePaid.isNegative()) {
      throw new NegativeValuesNotAllowedError()
    }

    const discountLoans = command.discountLoans ?? false

    const transactions = await this.transactionRunner.run(
      async (tx: Prisma.TransactionClient) => {
        const txs: Transaction[] = []

        if (discountLoans) {
          const { transactions: loanTransactions } =
            await this.payLoansUseCase.execute({
              affectedUser,
              amount: commissionToBePaid,
              tx,
            })

          txs.push(...loanTransactions)
        }

        logger.debug('payment will be made for a fixed amount', {
          commissionToBePaid: commissionToBePaid.toNumber(),
        })

        const commissionPayment = await this.payCommissionUseCase.execute({
          actorId: command.actorId,
          affectedUserId: affectedUser.id,
          description: command.description,
          amount: commissionToBePaid,
          reason: command.reason,
          tx,
        })

        txs.push(...commissionPayment.transactions)

        logger.debug('updated cash with the value', {
          value: commissionToBePaid.multiply(-1).toNumber(),
        })

        await this.updateCashRegisterFinalAmount.execute(
          {
            sessionId: session.id,
            amount: commissionPayment.totalPaid.multiply(-1),
          },
          tx,
        )

        return txs
      },
    )

    return transactions
  }
}
