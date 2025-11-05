import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepositoryPort } from '@/modules/finance/application/ports/cash-register-repository'
import { PayUserLoansUseCase } from '@/modules/finance/application/use-cases/pay-user-loans'
import { UpdateCashFinalAmountUseCase } from '@/modules/finance/application/use-cases/update-cash-final-amount'
import { logger } from '@/lib/logger'
import { Money } from '@/core/domain/value-objects/money'
import { Transaction } from '@prisma/client'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { AffectedUserNotFoundError } from '@/services/@errors/transaction/affected-user-not-found-error'
import { InsufficientBalanceError } from '@/services/@errors/transaction/insufficient-balance-error'
import { AmountsUserInconsistentError } from '@/services/@errors/user/amounts-user-inconsistent'
import { NegativeValuesNotAllowedError } from '../errors/negative-values-not-allowed-error'
import { TransactionRunner } from '@/core/application/ports/transaction-runner'
import {
  TransactionRunnerLike,
  normalizeTransactionRunner,
} from '@/core/application/utils/transaction-runner'
import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { InvalidPayBalanceInputError } from '../errors/invalid-pay-balance-input-error'
import { TransactionReason } from '../../domain/entities/transaction'
import { PayCommissionUseCase } from '@/modules/finance/application/use-cases/pay-commission'

type PaymentMode = 'amount' | 'items'

export interface PayBalanceCommand {
  actorId: string
  unitId: string
  affectedUserId: string
  description?: string
  amount?: Money
  saleItemIds?: string[]
  appointmentServiceIds?: string[]
  receiptUrl?: string | null
  discountLoans?: boolean
}

export interface PayBalanceResult {
  transactions: Transaction[]
}

export class PayBalanceUseCase {
  private readonly transactionRunner: TransactionRunner

  constructor(
    private readonly barberUserRepository: BarberUsersRepository,
    private readonly cashRegisterRepository: CashRegisterRepositoryPort,
    private readonly payCommissionUseCase: PayCommissionUseCase,
    private readonly payUserLoansUseCase: PayUserLoansUseCase,
    private readonly updateCashRegisterFinalAmount: UpdateCashFinalAmountUseCase,
    transactionRunner?: TransactionRunnerLike,
  ) {
    this.transactionRunner = normalizeTransactionRunner(
      transactionRunner,
      defaultTransactionRunner,
    )
  }

  async execute(command: PayBalanceCommand): Promise<PayBalanceResult> {
    logger.debug(PayBalanceUseCase.name, {
      actorId: command.actorId,
      unitId: command.unitId,
      affectedUserId: command.affectedUserId,
      amount: command.amount?.toNumber(),
      saleItemIds: command.saleItemIds,
      appointmentServiceIds: command.appointmentServiceIds,
      discountLoans: command.discountLoans ?? false,
    })

    const session = await this.cashRegisterRepository.findOpenByUnit(
      command.unitId,
    )

    if (!session) {
      throw new CashRegisterClosedError()
    }

    const affectedUser = await this.barberUserRepository.findById(
      command.affectedUserId,
    )

    if (!affectedUser) {
      throw new AffectedUserNotFoundError()
    }

    const paymentMode = this.resolvePaymentMode(command)

    const userBalance = Money.from(affectedUser.profile?.totalBalance ?? 0)

    const allPendingPreview = await this.payCommissionUseCase.preview(
      affectedUser.id,
    )

    const commissionToBePaid = await this.resolvePayment(
      paymentMode,
      command,
      affectedUser.id,
    )

    this.ensureConsistency({
      totalUserCommission: allPendingPreview.total,
      userBalance,
      commissionToBePaid,
    })

    if (commissionToBePaid.isNegative()) {
      throw new NegativeValuesNotAllowedError()
    }

    const discountLoans = command.discountLoans ?? false

    const transactions = await this.transactionRunner.run(async (tx) => {
      const acc: Transaction[] = []

      if (discountLoans) {
        const { transactions: loanTransactions } =
          await this.payUserLoansUseCase.execute({
            affectedUser,
            amount: commissionToBePaid,
            tx,
          })

        acc.push(...loanTransactions)
      }

      const commissionPayment = await this.payCommissionUseCase.execute({
        actorId: command.actorId,
        affectedUserId: affectedUser.id,
        description: command.description,
        amount: paymentMode === 'amount' ? commissionToBePaid : undefined,
        saleItemIds:
          paymentMode === 'items' ? command.saleItemIds ?? [] : undefined,
        appointmentServiceIds:
          paymentMode === 'items'
            ? command.appointmentServiceIds ?? []
            : undefined,
        reason: TransactionReason.PAY_COMMISSION,
        tx,
      })

      acc.push(...commissionPayment.transactions)

      await this.updateCashRegisterFinalAmount.execute(
        {
          sessionId: session.id,
          amount: commissionPayment.totalPaid.multiply(-1),
        },
        tx,
      )

      return acc
    })

    return { transactions }
  }

  private resolvePaymentMode(command: PayBalanceCommand): PaymentMode {
    if (command.amount) {
      return 'amount'
    }

    const hasItems = (command.saleItemIds?.length ?? 0) > 0
    const hasAppointmentServices =
      (command.appointmentServiceIds?.length ?? 0) > 0

    if (hasItems || hasAppointmentServices) {
      return 'items'
    }

    throw new InvalidPayBalanceInputError()
  }

  private async resolvePayment(
    mode: PaymentMode,
    command: PayBalanceCommand,
    affectedUserId: string,
  ): Promise<Money> {
    if (mode === 'amount') {
      return command.amount ?? Money.zero()
    }

    const preview = await this.payCommissionUseCase.preview(affectedUserId, {
      saleItemIds: command.saleItemIds,
      appointmentServiceIds: command.appointmentServiceIds,
    })

    return preview.total
  }

  private ensureConsistency(args: {
    totalUserCommission: Money
    userBalance: Money
    commissionToBePaid: Money
  }) {
    const { totalUserCommission, userBalance, commissionToBePaid } = args

    logger.debug('checks the consistency of the commission calculation', {
      totalUserCommission: totalUserCommission.toNumber(),
      balanceAffectedUser: userBalance.toNumber(),
    })

    if (totalUserCommission.toNumber() !== userBalance.toNumber()) {
      throw new AmountsUserInconsistentError()
    }

    logger.debug(
      'checks that the amount to be paid is not greater than the users balance',
      {
        commissionToBePaid: commissionToBePaid.toNumber(),
        balanceAffectedUser: userBalance.toNumber(),
      },
    )

    if (commissionToBePaid.toNumber() > userBalance.toNumber()) {
      throw new InsufficientBalanceError()
    }
  }
}
