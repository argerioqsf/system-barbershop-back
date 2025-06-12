import { prisma } from '@/lib/prisma'
import { Prisma, Transaction } from '@prisma/client'
import { TransactionRepository } from '../transaction-repository'

export type TransactionFull = Prisma.TransactionGetPayload<{
  include: {
    sale: {
      include: {
        coupon: true
        items: {
          include: {
            service: true
            barber: {
              include: {
                profile: true
              }
            }
            coupon: true
          }
          price: true
        }
        user: {
          include: {
            profile: true
          }
        }
      }
    }
  }
}>
export class PrismaTransactionRepository implements TransactionRepository {
  async create(data: Prisma.TransactionCreateInput): Promise<Transaction> {
    return prisma.transaction.create({ data })
  }

  async findManyByUser(userId: string): Promise<TransactionFull[]> {
    return prisma.transaction.findMany({
      where: { userId },
      include: {
        sale: {
          include: {
            coupon: true,
            items: {
              include: {
                service: true,
                barber: {
                  include: {
                    profile: true,
                  },
                },
                coupon: true,
              },
            },
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    })
  }

  async findMany(
    where: Prisma.TransactionWhereInput = {},
  ): Promise<TransactionFull[]> {
    return prisma.transaction.findMany({
      where,
      include: {
        sale: {
          include: {
            coupon: true,
            items: {
              include: {
                service: true,
                barber: {
                  include: {
                    profile: true,
                  },
                },
                coupon: true,
              },
            },
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    })
  }

  async findManyByUnit(unitId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({ where: { unitId } })
  }

  async findManyBySession(sessionId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { cashRegisterSessionId: sessionId },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.transaction.delete({ where: { id } })
  }
}
