import { Prisma, Transaction } from '@prisma/client'

export interface TransactionRepository {
  create(data: Prisma.TransactionCreateInput): Promise<Transaction>
  findManyByUser(userId: string): Promise<Transaction[]>
  findMany(where?: Prisma.TransactionWhereInput): Promise<Transaction[]>
  findManyByUnit(unitId: string): Promise<Transaction[]>
  findManyBySession(sessionId: string): Promise<Transaction[]>
}
