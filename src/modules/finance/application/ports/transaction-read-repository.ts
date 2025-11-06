import type { Transaction } from '@prisma/client'
import type { ResponseTransactionsFindMany } from '@/repositories/transaction-repository'

export interface TransactionReadFilter {
  unitId?: string
  userId?: string
  affectedUserId?: string
}

export type TransactionReadItem = ResponseTransactionsFindMany['items'][number]

export interface TransactionReadRepository {
  findMany(
    filter: TransactionReadFilter,
    pagination?: { page?: number; perPage?: number },
  ): Promise<ResponseTransactionsFindMany>

  findManyByUnit(unitId: string): Promise<Transaction[]>

  findManyByAffectedUser(affectedUserId: string): Promise<TransactionReadItem[]>
}
