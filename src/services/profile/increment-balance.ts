import { TransactionRepository } from '@/repositories/transaction-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Profile, Transaction, TransactionType, User } from '@prisma/client'

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
    sessionId: string,
    amount: number,
    saleId?: string,
  ): Promise<IncrementBalanceProfileResponse> {
    let transaction: Transaction | undefined
    let profile: IncrementBalanceProfileResponse['profile'] = null
    try {
      await this.repository.incrementBalance(userId, amount)
      profile = await this.repository.findByUserId(userId)
      const unitId = profile?.user.unitId as string
      transaction = await this.transactionRepository.create({
        user: { connect: { id: userId } },
        unit: { connect: { id: unitId } },
        session: { connect: { id: sessionId } },
        sale: saleId ? { connect: { id: saleId } } : undefined,
        type:
          amount < 0 ? TransactionType.WITHDRAWAL : TransactionType.ADDITION,
        description: 'Increment Balance Profile',
        amount,
      })
    } catch (error) {
      await this.repository.incrementBalance(userId, -amount)
      throw error
    }
    return { profile, transaction }
  }
}
