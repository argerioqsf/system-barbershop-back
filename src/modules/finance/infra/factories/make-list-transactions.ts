import { ListTransactionsQuery } from '@/modules/finance/application/query-handlers/list-transactions'
import { PrismaTransactionReadRepository } from '@/modules/finance/infra/repositories/prisma/prisma-transaction-read-repository'

export function makeListTransactionsQuery() {
  const transactionRepository = new PrismaTransactionReadRepository()
  return new ListTransactionsQuery(transactionRepository)
}
