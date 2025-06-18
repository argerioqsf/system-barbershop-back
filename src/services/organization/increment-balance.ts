import { TransactionRepository } from '@/repositories/transaction-repository'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { Organization, Transaction, TransactionType } from '@prisma/client'

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
    unitId: string,
    sessionId: string,
    amount: number,
    saleId?: string,
  ): Promise<IncrementBalanceOrganizationResponse> {
    let transaction: Transaction | undefined
    let organization: Organization | null = null
    try {
      await this.repository.incrementBalance(id, amount)
      organization = await this.repository.findById(id)
      transaction = await this.transactionRepository.create({
        user: { connect: { id: userId } },
        unit: { connect: { id: unitId } },
        session: { connect: { id: sessionId } },
        sale: saleId ? { connect: { id: saleId } } : undefined,
        type:
          amount < 0 ? TransactionType.WITHDRAWAL : TransactionType.ADDITION,
        description: 'Increment Balance Organization',
        amount,
      })
    } catch (error) {
      await this.repository.incrementBalance(id, -amount)
      throw error
    }
    return { organization, transaction }
  }
}
