import { prisma } from '@/lib/prisma'
import { Prisma, Transaction } from '@prisma/client'
import { TransactionRepository } from '../transaction-repository'

export class PrismaTransactionRepository implements TransactionRepository {
  async create(data: Prisma.TransactionCreateInput): Promise<Transaction> {
    return prisma.transaction.create({ data })
  }

  async findManyByUser(userId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({ where: { userId } })
  }

  async findMany(): Promise<Transaction[]> {
    return prisma.transaction.findMany()
  }
}
