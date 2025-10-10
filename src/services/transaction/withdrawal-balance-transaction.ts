import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Transaction } from '@prisma/client'
import { UnitRepository } from '@/repositories/unit-repository'
import { IncrementBalanceUnitService } from '../unit/increment-balance'
import { IncrementBalanceProfileService } from '../profile/increment-balance'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { AffectedUserNotFoundError } from '@/services/@errors/transaction/affected-user-not-found-error'
import { NegativeValuesNotAllowedError } from '@/services/@errors/transaction/negative-values-not-allowed-error'
import { InsufficientBalanceError } from '@/services/@errors/transaction/insufficient-balance-error'
import { WithdrawalGreaterThanUnitBalanceError } from '@/services/@errors/transaction/withdrawal-greater-than-unit-balance-error'
import { prisma } from '@/lib/prisma'
import { UpdateCashRegisterFinalAmountService } from '../cash-register/update-cash-register-final-amount'
import { round, toCents } from '@/utils/format-currency'

interface WithdrawalBalanceTransactionRequest {
  userId: string
  affectedUserId?: string
  description: string
  amount: number
  receiptUrl?: string | null
}

interface WithdrawalBalanceTransactionResponse {
  transactions: Transaction[]
}

export class WithdrawalBalanceTransactionService {
  constructor(
    private barberUserRepository: BarberUsersRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private profileRepository: ProfilesRepository,
    private unitRepository: UnitRepository,
    private incrementProfileService: IncrementBalanceProfileService,
    private incrementUnitService: IncrementBalanceUnitService,
    private updateCashRegisterFinalAmountService: UpdateCashRegisterFinalAmountService,
  ) {}

  async execute(
    data: WithdrawalBalanceTransactionRequest,
  ): Promise<WithdrawalBalanceTransactionResponse> {
    const user = await this.barberUserRepository.findById(data.userId)
    if (!user) throw new UserNotFoundError()

    const session = await this.cashRegisterRepository.findOpenByUnit(
      user.unitId,
    )
    if (!session) throw new CashRegisterClosedError()

    const withdrawalAmount = round(data.amount)
    if (withdrawalAmount <= 0) {
      throw new NegativeValuesNotAllowedError()
    }

    const effectiveUser = data.affectedUserId
      ? await this.barberUserRepository.findById(data.affectedUserId)
      : user

    if (!effectiveUser) throw new AffectedUserNotFoundError()

    const userBalance = round(effectiveUser.profile?.totalBalance ?? 0)
    const unitBalance = round(effectiveUser.unit?.totalBalance ?? 0)

    const finalUserBalance = round(userBalance - withdrawalAmount)

    const transactions = await prisma.$transaction(async (tx) => {
      const txs: Transaction[] = []

      // If the withdrawal results in a negative balance, it's a loan
      if (toCents(finalUserBalance) < 0) {
        if (!effectiveUser.unit?.allowsLoan) {
          throw new InsufficientBalanceError()
        }

        const loanAmount = -finalUserBalance
        if (toCents(loanAmount) > toCents(unitBalance)) {
          throw new WithdrawalGreaterThanUnitBalanceError()
        }

        // Decrement user balance (it will become negative)
        const transactionProfile = await this.incrementProfileService.execute(
          effectiveUser.id,
          -withdrawalAmount,
          undefined,
          true, // isLoan
          data.description,
          undefined,
          undefined,
          undefined,
          tx,
        )

        // Decrement unit balance because the unit is loaning money
        const transactionUnit = await this.incrementUnitService.execute(
          effectiveUser.unitId,
          effectiveUser.id,
          -loanAmount, // The amount the unit is effectively losing
          undefined,
          true, // isLoan
          undefined,
          undefined,
          tx,
        )
        txs.push(transactionProfile.transaction, transactionUnit.transaction)
      } else {
        // Simple withdrawal, no loan involved
        const transactionProfile = await this.incrementProfileService.execute(
          effectiveUser.id,
          -withdrawalAmount,
          undefined,
          false, // isLoan
          data.description,
          undefined,
          undefined,
          undefined,
          tx,
        )
        txs.push(transactionProfile.transaction)
      }

      // Update cash register with the withdrawal amount
      await this.updateCashRegisterFinalAmountService.execute(
        { sessionId: session.id, amount: -withdrawalAmount },
        tx,
      )

      return txs
    })

    return { transactions }
  }
}
