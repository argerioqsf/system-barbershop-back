import { prisma } from '@/lib/prisma'
import { Prisma, Transaction } from '@prisma/client'
import {
  ResponseTransactionsFindMany,
  TransactionRepository,
} from '../transaction-repository'

export type TransactionFull = Prisma.TransactionGetPayload<{
  include: {
    sale: {
      include: {
        coupon: true
        items: {
          include: {
            service: true
            product: true
            barber: {
              include: {
                profile: true
              }
            }
            discounts: true
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
  async create(
    data: Prisma.TransactionCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const prismaClient = tx || prisma
    return prismaClient.transaction.create({ data })
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
                discounts: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findMany(
    where: Prisma.TransactionWhereInput = {},
    pagination?: { page: number; perPage: number },
  ): Promise<ResponseTransactionsFindMany> {
    const { page = 1, perPage = 10 } = pagination || {}
    const skip = (page - 1) * perPage

    const [items, count] = await prisma.$transaction([
      prisma.transaction.findMany({
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
                  discounts: true,
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
          user: true,
          affectedUser: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: perPage,
      }),
      prisma.transaction.count({ where }),
    ])

    return { items, count }
  }

  async findManyByUnit(unitId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { unitId },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findManyBySession(sessionId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { cashRegisterSessionId: sessionId },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.transaction.delete({ where: { id } })
  }

  async findManyByAffectedUser(
    affectedUserId: string,
  ): Promise<TransactionFull[]> {
    return prisma.transaction.findMany({
      where: { affectedUserId },
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
                discounts: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}
