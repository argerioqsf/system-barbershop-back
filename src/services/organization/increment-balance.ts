import { TransactionRepository } from '@/repositories/transaction-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { Organization, Transaction, TransactionType } from '@prisma/client'
import { makeCreateTransaction } from '../@factories/transaction/make-create-transaction'

interface IncrementBalanceOrganizationResponse {
  organization: Organization | null
  transaction: Transaction
}

export class IncrementBalanceOrganizationService {
  constructor(
    private repository: OrganizationRepository,
    private transactionRepository: TransactionRepository,
  ) {}

  async execute(
    id: string,
    userId: string,
    amount: number,
    saleId?: string,
    isLoan?: boolean,
  ): Promise<IncrementBalanceOrganizationResponse> {
    const createTransactionService = makeCreateTransaction()
    try {
      let organization: Organization | null = null
      organization = await this.repository.incrementBalance(id, amount)
      const transaction = await createTransactionService.execute({
        type:
          amount < 0 ? TransactionType.WITHDRAWAL : TransactionType.ADDITION,
        description: 'Increment Balance Organization',
        amount: isLoan ? amount : Math.abs(amount),
        userId,
        receiptUrl: undefined,
        saleId,
        isLoan: isLoan ?? false,
      })
      return { organization, transaction: transaction.transaction }
    } catch (error) {
      await this.repository.incrementBalance(id, -amount)
      throw error
    }
  }
}
