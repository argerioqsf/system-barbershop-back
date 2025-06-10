import { prisma } from '@/lib/prisma'
import { Prisma, Sale } from '@prisma/client'
import { SaleRepository } from '../sale-repository'

export class PrismaSaleRepository implements SaleRepository {
  async create(data: Prisma.SaleCreateInput): Promise<Sale> {
    return prisma.sale.create({ data, include: { items: true, user: true, coupon: true } })
  }

  async findMany(): Promise<Sale[]> {
    return prisma.sale.findMany({ include: { items: true, user: true, coupon: true } })
  }

  async findById(id: string): Promise<Sale | null> {
    return prisma.sale.findUnique({ where: { id }, include: { items: true, user: true, coupon: true } })
  }

  async findManyByDateRange(start: Date, end: Date): Promise<Sale[]> {
    return prisma.sale.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { items: true, user: true, coupon: true },
    })
  }

  async findManyByUser(userId: string): Promise<Sale[]> {
    return prisma.sale.findMany({
      where: { userId },
      include: { items: true, user: true, coupon: true },
    })
  }
}
