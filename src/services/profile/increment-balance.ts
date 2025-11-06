import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Prisma, Profile, Transaction, TransactionType } from '@prisma/client'
import { makeCreateTransaction } from '../@factories/transaction/make-create-transaction'
import { UserNotFoundError } from '@/core/application/errors/user-not-found-error'
import { TransactionReason } from '@/modules/finance/domain/entities/transaction'
import { Money } from '@/core/domain/value-objects/money'

interface IncrementBalanceProfileResponse {
  profile: Profile | null
  transaction: Transaction
}

export class IncrementBalanceProfileService {
  constructor(private repository: ProfilesRepository) {}

  async execute(
    affectedUserId: string,
    amount: number,
    options: {
      reason: TransactionReason
      tx?: Prisma.TransactionClient
      userId?: string
    },
    saleId?: string,
    isLoan?: boolean,
    description?: string,
    saleItemId?: string,
    appointmentServiceId?: string,
    loanId?: string,
  ): Promise<IncrementBalanceProfileResponse> {
    const createTransactionService = makeCreateTransaction()

    const profileToUpdate = await this.repository.findByUserId(
      affectedUserId,
      options.tx,
    )

    if (!profileToUpdate) {
      throw new UserNotFoundError() // Or a more specific ProfileNotFoundError
    }

    const amountMoney = Money.from(amount)
    const currentBalance = Money.from(profileToUpdate.totalBalance ?? 0)
    const newBalance = currentBalance.add(amountMoney)

    const profile = await this.repository.update(
      profileToUpdate.id,
      {
        totalBalance: newBalance.toNumber(),
      },
      options.tx,
    )

    const transaction = await createTransactionService.execute({
      type: amountMoney.isNegative()
        ? TransactionType.WITHDRAWAL
        : TransactionType.ADDITION,
      description: description ?? 'Increment Balance Profile',
      amount: amountMoney.abs().toNumber(),
      userId: options.userId ?? affectedUserId,
      receiptUrl: undefined,
      saleId,
      saleItemId,
      appointmentServiceId,
      isLoan: isLoan ?? false,
      affectedUserId,
      loanId,
      tx: options.tx,
      reason: options.reason,
    })

    return { profile, transaction: transaction.transaction }
  }
}
