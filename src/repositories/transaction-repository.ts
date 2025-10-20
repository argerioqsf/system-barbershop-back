import { Prisma, Transaction, User } from '@prisma/client'
import { TransactionFull } from './prisma/prisma-transaction-repository'

export type ResponseTransactionsFindMany = {
  items: (TransactionFull & { user: User | null; affectedUser: User | null })[]
  count: number
}

export interface TransactionRepository {
  create(
    data: Prisma.TransactionCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction>
  findManyByUser(userId: string): Promise<TransactionFull[]>
  findMany(
    where?: Prisma.TransactionWhereInput,
    pagination?: { page: number; perPage: number },
  ): Promise<{ items: TransactionFull[]; count: number }>
  findManyByUnit(unitId: string): Promise<Transaction[]>
  findManyBySession(sessionId: string): Promise<Transaction[]>
  delete(id: string): Promise<void>
  findManyByAffectedUser(affectedUserId: string): Promise<TransactionFull[]>
}
