import { TransactionRepository } from '@/repositories/transaction-repository'
import { Transaction } from '@prisma/client'

interface ListTransactionsResponse {
  transactions: Transaction[]
}

export class ListTransactionsService {
  constructor(private repository: TransactionRepository) {}

  async execute(): Promise<ListTransactionsResponse> {
    const transactions = await this.repository.findMany()
    return { transactions }
  }
}
