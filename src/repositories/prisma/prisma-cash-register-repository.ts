import { prisma } from '@/lib/prisma'
import { Prisma, CashRegisterSession, User } from '@prisma/client'
import { CashRegisterRepository, DetailedCashSession, CompleteCashSession } from '../cash-register-repository'

export class PrismaCashRegisterRepository implements CashRegisterRepository {
  async create(data: Prisma.CashRegisterSessionCreateInput): Promise<CashRegisterSession> {
    return prisma.cashRegisterSession.create({ data })
  }

  async close(id: string, data: Prisma.CashRegisterSessionUpdateInput): Promise<CashRegisterSession> {
    return prisma.cashRegisterSession.update({ where: { id }, data })
  }

  async findMany(): Promise<DetailedCashSession[]> {
    return prisma.cashRegisterSession.findMany({
      include: { user: true, sales: true },
    })
  }

  async findManyByUnit(unitId: string): Promise<DetailedCashSession[]> {
    return prisma.cashRegisterSession.findMany({
      where: { unitId },
      include: { user: true, sales: true },
    })
  }

  async findOpenByUser(userId: string): Promise<CashRegisterSession | null> {
    return prisma.cashRegisterSession.findFirst({
      where: { openedById: userId, closedAt: null },
    })
  }

  async findOpenByUnit(unitId: string): Promise<CashRegisterSession | null> {
    return prisma.cashRegisterSession.findFirst({
      where: { unitId, closedAt: null },
    })
  }

  async findById(id: string): Promise<CompleteCashSession | null> {
    return prisma.cashRegisterSession.findUnique({
      where: { id },
      include: {
        user: true,
        sales: {
          include: {
            items: { include: { service: true } },
            user: { include: { profile: true } },
            coupon: true,
          },
        },
        transactions: true,
      },
    })
  }
}
