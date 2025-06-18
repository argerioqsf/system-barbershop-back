import { TransactionRepository } from '@/repositories/transaction-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Profile, Transaction, TransactionType, User } from '@prisma/client'
import { makeCreateTransaction } from '../@factories/transaction/make-create-transaction'

interface IncrementBalanceProfileResponse {
  profile: (Profile & { user: Omit<User, 'password'> }) | null
  transaction: Transaction
}

export class IncrementBalanceProfileService {
  constructor(
    private repository: ProfilesRepository,
    private transactionRepository: TransactionRepository,
  ) {}

  async execute(
    userId: string,
    amount: number,
    saleId?: string,
  ): Promise<IncrementBalanceProfileResponse> {
    const createTransactionService = makeCreateTransaction()
    try {
      let profile: IncrementBalanceProfileResponse['profile'] = null
      profile = await this.repository.incrementBalance(userId, amount)
      const transaction = await createTransactionService.execute({
        type:
          amount < 0 ? TransactionType.WITHDRAWAL : TransactionType.ADDITION,
        description: 'Increment Balance Profile',
        amount: amount < 0 ? -amount : amount,
        userId,
        receiptUrl: undefined,
        saleId,
        affectedUserId: userId,
      })
      return { profile, transaction: transaction.transaction }
    } catch (error) {
      await this.repository.incrementBalance(userId, -amount)
      throw error
    }
  }
}
