import { TransactionRepository } from '@/repositories/transaction-repository'
import { Transaction } from '@prisma/client'

interface ListTransactionsResponse {
  transactions: Transaction[]
}

export class ListTransactionsService {
  constructor(private repository: TransactionRepository) {}

  async execute(unitId: string): Promise<ListTransactionsResponse> {
    const transactions = await this.repository.findManyByUnit(unitId)
    return { transactions }
  }
}
