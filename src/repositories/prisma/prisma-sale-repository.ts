import { prisma } from '@/lib/prisma'
import { Prisma, Sale, SaleItem, Service, User, Coupon } from '@prisma/client'
import { SaleRepository, DetailedSale } from '../sale-repository'

export class PrismaSaleRepository implements SaleRepository {
  async create(data: Prisma.SaleCreateInput): Promise<DetailedSale> {
    return prisma.sale.create({
      data,
      include: {
        items: { include: { service: true, barber: { include: { profile: true } } } },
        user: { include: { profile: true } },
        coupon: true,
        session: true,
      },
    })
  }

  async findMany(where: Prisma.SaleWhereInput = {}): Promise<DetailedSale[]> {
    return prisma.sale.findMany({
      where,
      include: {
        items: { include: { service: true, barber: { include: { profile: true } } } },
        user: { include: { profile: true } },
        coupon: true,
        session: true,
      },
    })
  }

  async findById(id: string): Promise<DetailedSale | null> {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { service: true, barber: { include: { profile: true } } } },
        user: { include: { profile: true } },
        coupon: true,
        session: true,
      },
    })
  }

  async findManyByDateRange(start: Date, end: Date): Promise<DetailedSale[]> {
    return prisma.sale.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        items: { include: { service: true, barber: { include: { profile: true } } } },
        user: { include: { profile: true } },
        coupon: true,
        session: true,
      },
    })
  }

  async findManyByUser(userId: string): Promise<DetailedSale[]> {
    return prisma.sale.findMany({
      where: { userId },
      include: {
        items: { include: { service: true, barber: { include: { profile: true } } } },
        user: { include: { profile: true } },
        coupon: true,
        session: true,
      },
    })
  }

  async findManyByBarber(barberId: string): Promise<DetailedSale[]> {
    return prisma.sale.findMany({
      where: { items: { some: { barberId } } },
      include: {
        items: { include: { service: true, barber: { include: { profile: true } } } },
        user: { include: { profile: true } },
        coupon: true,
        session: true,
      },
    })
  }

  async findManyBySession(sessionId: string): Promise<DetailedSale[]> {
    return prisma.sale.findMany({
      where: { sessionId },
      include: {
        items: { include: { service: true, barber: { include: { profile: true } } } },
        user: { include: { profile: true } },
        coupon: true,
        session: true,
      },
    })
  }
}
