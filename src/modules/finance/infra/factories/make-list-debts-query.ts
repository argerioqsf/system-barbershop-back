import { PrismaDebtsRepositoryAdapter } from '@/modules/finance/infra/repositories/prisma/prisma-debts-repository'
import { ListDebtsQuery } from '@/modules/finance/application/query-handlers/list-debts-query'

export function makeListDebtsQuery() {
  const debtsRepository = new PrismaDebtsRepositoryAdapter()
  const query = new ListDebtsQuery(debtsRepository)
  return query
}
