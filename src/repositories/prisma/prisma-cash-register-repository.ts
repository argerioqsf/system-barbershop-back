import { prisma } from '@/lib/prisma'
import { Prisma, CashRegisterSession } from '@prisma/client'
import { CashRegisterRepository } from '../cash-register-repository'

export class PrismaCashRegisterRepository implements CashRegisterRepository {
  async create(data: Prisma.CashRegisterSessionCreateInput): Promise<CashRegisterSession> {
    return prisma.cashRegisterSession.create({ data })
  }

  async close(id: string, data: Prisma.CashRegisterSessionUpdateInput): Promise<CashRegisterSession> {
    return prisma.cashRegisterSession.update({ where: { id }, data })
  }

  async findMany(): Promise<CashRegisterSession[]> {
    return prisma.cashRegisterSession.findMany({ include: { user: true } })
  }

  async findManyByUnit(unitId: string): Promise<CashRegisterSession[]> {
    return prisma.cashRegisterSession.findMany({ where: { unitId }, include: { user: true } })
  }

  async findOpenByUser(userId: string): Promise<CashRegisterSession | null> {
    return prisma.cashRegisterSession.findFirst({
      where: { openedById: userId, closedAt: null },
    })
  }
}
