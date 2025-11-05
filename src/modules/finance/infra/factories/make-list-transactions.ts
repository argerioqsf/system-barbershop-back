import { ListTransactionsQuery } from '@/modules/finance/application/query-handlers/list-transactions'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'

export function makeListTransactionsQuery() {
  const transactionRepository = new PrismaTransactionRepository()
  return new ListTransactionsQuery(transactionRepository)
}
