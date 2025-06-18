import { TransactionRepository } from '@/repositories/transaction-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { Transaction, TransactionType, Unit } from '@prisma/client'

interface IncrementBalanceUnitResponse {
  unit: Unit | null
  transaction: Transaction
}

export class IncrementBalanceUnitService {
  constructor(
    private repository: UnitRepository,
    private transactionRepository: TransactionRepository,
  ) {}

  async execute(
    id: string,
    userId: string,
    sessionId: string,
    amount: number,
    saleId?: string,
  ): Promise<IncrementBalanceUnitResponse> {
    let transaction: Transaction | undefined
    let unit: Unit | null = null
    try {
      await this.repository.incrementBalance(id, amount)
      unit = await this.repository.findById(id)
      transaction = await this.transactionRepository.create({
        user: { connect: { id: userId } },
        unit: { connect: { id } },
        session: { connect: { id: sessionId } },
        sale: saleId ? { connect: { id: saleId } } : undefined,
        type:
          amount < 0 ? TransactionType.WITHDRAWAL : TransactionType.ADDITION,
        description: 'Increment Balance Unit',
        amount,
      })
    } catch (error) {
      await this.repository.incrementBalance(id, -amount)
      throw error
    }
    return { unit, transaction }
  }
}
