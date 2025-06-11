import { prisma } from '@/lib/prisma'
import { Prisma, Transaction } from '@prisma/client'
import { TransactionRepository } from '../transaction-repository'

export class PrismaTransactionRepository implements TransactionRepository {
  async create(data: Prisma.TransactionCreateInput): Promise<Transaction> {
    return prisma.transaction.create({ data })
  }

  async findManyByUser(userId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { userId },
      include: {
        sale: {
          include: {
            items: { include: { service: true, barber: true, coupon: true } },
            coupon: true,
          },
        },
      },
    })
  }

  async findMany(): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      include: {
        sale: {
          include: {
            items: { include: { service: true, barber: true, coupon: true } },
            coupon: true,
          },
        },
      },
    })
  }

  async findManyByUnit(unitId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { unitId },
      include: {
        sale: {
          include: {
            items: { include: { service: true, barber: true, coupon: true } },
            coupon: true,
          },
        },
      },
    })
  }

  async findManyBySession(sessionId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { cashRegisterSessionId: sessionId },
      include: {
        sale: {
          include: {
            items: { include: { service: true, barber: true, coupon: true } },
            coupon: true,
          },
        },
      },
    })
  }
}
