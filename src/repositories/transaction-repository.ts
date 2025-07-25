import { Prisma, Transaction } from '@prisma/client'
import { TransactionFull } from './prisma/prisma-transaction-repository'

export interface TransactionRepository {
  create(
    data: Prisma.TransactionCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction>
  findManyByUser(userId: string): Promise<TransactionFull[]>
  findMany(where?: Prisma.TransactionWhereInput): Promise<TransactionFull[]>
  findManyByUnit(unitId: string): Promise<Transaction[]>
  findManyBySession(sessionId: string): Promise<Transaction[]>
  delete(id: string): Promise<void>
}
