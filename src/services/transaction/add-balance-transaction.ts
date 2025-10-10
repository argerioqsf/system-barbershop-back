import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { CashRegisterRepository } from '@/repositories/cash-register-repository'
import { Transaction } from '@prisma/client'
import { IncrementBalanceUnitService } from '../unit/increment-balance'
import { IncrementBalanceProfileService } from '../profile/increment-balance'
import { UserNotFoundError } from '@/services/@errors/user/user-not-found-error'
import { CashRegisterClosedError } from '@/services/@errors/cash-register/cash-register-closed-error'
import { AffectedUserNotFoundError } from '@/services/@errors/transaction/affected-user-not-found-error'
import { NegativeValuesNotAllowedError } from '@/services/@errors/transaction/negative-values-not-allowed-error'
import { prisma } from '@/lib/prisma'
import { UpdateCashRegisterFinalAmountService } from '../cash-register/update-cash-register-final-amount'
import { round, toCents } from '@/utils/format-currency'

interface AddBalanceTransactionRequest {
  userId: string
  affectedUserId?: string
  description: string
  amount: number
  receiptUrl?: string | null
}

interface AddBalanceTransactionResponse {
  transactions: Transaction[]
}

export class AddBalanceTransactionService {
  constructor(
    private barberUserRepository: BarberUsersRepository,
    private cashRegisterRepository: CashRegisterRepository,
    private incrementProfileService: IncrementBalanceProfileService,
    private incrementUnitService: IncrementBalanceUnitService,
    private updateCashRegisterFinalAmountService: UpdateCashRegisterFinalAmountService,
  ) {}

  async execute(
    data: AddBalanceTransactionRequest,
  ): Promise<AddBalanceTransactionResponse> {
    const user = await this.barberUserRepository.findById(data.userId)
    if (!user) throw new UserNotFoundError()

    const session = await this.cashRegisterRepository.findOpenByUnit(
      user.unitId,
    )
    if (!session) throw new CashRegisterClosedError()

    const additionAmount = round(data.amount)
    if (additionAmount <= 0) {
      throw new NegativeValuesNotAllowedError()
    }

    const transactions = await prisma.$transaction(async (tx) => {
      const txs: Transaction[] = []

      if (data.affectedUserId) {
        const affectedUser = await this.barberUserRepository.findById(
          data.affectedUserId,
        )
        if (!affectedUser) throw new AffectedUserNotFoundError()

        const userBalance = round(affectedUser.profile?.totalBalance ?? 0)

        // If user has a negative balance (a debt to the unit)
        if (toCents(userBalance) < 0) {
          const debtAmount = -userBalance
          const amountToPayDebt = round(Math.min(additionAmount, debtAmount))

          // Part of the addition pays off the debt
          if (toCents(amountToPayDebt) > 0) {
            // 1. Increment user's balance (making it less negative)
            const profileTx = await this.incrementProfileService.execute(
              affectedUser.id,
              amountToPayDebt,
              undefined,
              true, // isLoan
              `Debt payment: ${data.description}`,
              undefined,
              undefined,
              undefined,
              tx,
            )
            // 2. Increment unit's balance (as it's getting its loaned money back)
            const unitTx = await this.incrementUnitService.execute(
              affectedUser.unitId,
              affectedUser.id,
              amountToPayDebt,
              undefined,
              true, // isLoan
              `Debt payment received: ${data.description}`,
              undefined,
              tx,
            )
            txs.push(profileTx.transaction, unitTx.transaction)
          }

          // If there's a remaining amount after paying the debt, add it as a normal commission
          const remainingAddition = round(additionAmount - amountToPayDebt)
          if (toCents(remainingAddition) > 0) {
            const profileTx = await this.incrementProfileService.execute(
              affectedUser.id,
              remainingAddition,
              undefined,
              false, // isLoan
              data.description,
              undefined,
              undefined,
              undefined,
              tx,
            )
            txs.push(profileTx.transaction)
          }
        } else {
          // Simple addition to a positive or zero balance
          const profileTx = await this.incrementProfileService.execute(
            affectedUser.id,
            additionAmount,
            undefined,
            false, // isLoan
            data.description,
            undefined,
            undefined,
            undefined,
            tx,
          )
          txs.push(profileTx.transaction)
        }
      } else {
        // If no affectedUser, it's a direct addition to the unit's balance
        const unitTx = await this.incrementUnitService.execute(
          user.unitId,
          user.id,
          additionAmount,
          undefined,
          false, // isLoan
          data.description,
          undefined,
          tx,
        )
        txs.push(unitTx.transaction)
      }

      // Update cash register with the addition amount
      await this.updateCashRegisterFinalAmountService.execute(
        { sessionId: session.id, amount: additionAmount },
        tx,
      )

      return txs
    })

    return { transactions }
  }
}
