import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Prisma, Profile, Transaction, TransactionType } from '@prisma/client'
import { makeCreateTransaction } from '../@factories/transaction/make-create-transaction'
import { round } from '@/utils/format-currency'
import { UserNotFoundError } from '../@errors/user/user-not-found-error'

interface IncrementBalanceProfileResponse {
  profile: Profile | null
  transaction: Transaction
}

export class IncrementBalanceProfileService {
  constructor(private repository: ProfilesRepository) {}

  async execute(
    userId: string,
    amount: number,
    saleId?: string,
    isLoan?: boolean,
    description?: string,
    saleItemId?: string,
    appointmentServiceId?: string,
    loanId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<IncrementBalanceProfileResponse> {
    const createTransactionService = makeCreateTransaction()

    const profileToUpdate = await this.repository.findByUserId(userId, tx)

    if (!profileToUpdate) {
      throw new UserNotFoundError() // Or a more specific ProfileNotFoundError
    }

    const currentBalance = profileToUpdate.totalBalance
    const newBalance = round(currentBalance + amount)

    const profile = await this.repository.update(
      profileToUpdate.id,
      {
        totalBalance: newBalance,
      },
      tx,
    )

    const transaction = await createTransactionService.execute({
      type: amount < 0 ? TransactionType.WITHDRAWAL : TransactionType.ADDITION,
      description: description ?? 'Increment Balance Profile',
      amount: Math.abs(amount),
      userId,
      receiptUrl: undefined,
      saleId,
      saleItemId,
      appointmentServiceId,
      isLoan: isLoan ?? false,
      affectedUserId: userId,
      loanId,
      tx,
    })

    return { profile, transaction: transaction.transaction }
  }
}
