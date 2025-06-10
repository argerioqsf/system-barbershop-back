import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { ListTransactionsService } from '@/services/transaction/list-transactions'

export function makeListTransactions() {
  return new ListTransactionsService(new PrismaTransactionRepository())
}
