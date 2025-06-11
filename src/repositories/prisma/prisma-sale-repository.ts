import { prisma } from '@/lib/prisma'
import { Prisma, Sale } from '@prisma/client'
import { SaleRepository } from '../sale-repository'

export class PrismaSaleRepository implements SaleRepository {
  async create(data: Prisma.SaleCreateInput): Promise<Sale> {
    return prisma.sale.create({
      data,
      include: {
        items: { include: { service: true } },
        user: true,
        coupon: true,
      },
    })
  }

  async findMany(where: Prisma.SaleWhereInput = {}): Promise<Sale[]> {
    return prisma.sale.findMany({
      where,
      include: {
        items: { include: { service: true } },
        user: true,
        coupon: true,
      },
    })
  }

  async findById(id: string): Promise<Sale | null> {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { service: true } },
        user: true,
        coupon: true,
      },
    })
  }

  async findManyByDateRange(start: Date, end: Date): Promise<Sale[]> {
    return prisma.sale.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        items: { include: { service: true } },
        user: true,
        coupon: true,
      },
    })
  }

  async findManyByUser(userId: string): Promise<Sale[]> {
    return prisma.sale.findMany({
      where: { userId },
      include: {
        items: { include: { service: true } },
        user: true,
        coupon: true,
      },
    })
  }
}
