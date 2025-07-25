import { ProfilesRepository } from '@/repositories/profiles-repository'
import {
  Prisma,
  Profile,
  Transaction,
  TransactionType,
  User,
} from '@prisma/client'
import { makeCreateTransaction } from '../@factories/transaction/make-create-transaction'

interface IncrementBalanceProfileResponse {
  profile: (Profile & { user: Omit<User, 'password'> }) | null
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
    let profile: IncrementBalanceProfileResponse['profile'] = null
    profile = await this.repository.incrementBalance(userId, amount, tx)
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
