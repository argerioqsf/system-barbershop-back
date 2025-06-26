import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { SaleRepository, DetailedSale } from '../sale-repository'

export class PrismaSaleRepository implements SaleRepository {
  async create(data: Prisma.SaleCreateInput): Promise<DetailedSale> {
    const sale = await prisma.sale.create({
      data,
      include: {
        items: {
          include: {
            service: true,
            product: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    return sale as unknown as DetailedSale
  }

  async findMany(where: Prisma.SaleWhereInput = {}): Promise<DetailedSale[]> {
    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            service: true,
            product: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    return sales as unknown as DetailedSale[]
  }

  async findById(id: string): Promise<DetailedSale | null> {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            service: true,
            product: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    return sale as unknown as DetailedSale | null
  }

  async update(
    id: string,
    data: Prisma.SaleUpdateInput,
  ): Promise<DetailedSale> {
    const sale = await prisma.sale.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            service: true,
            product: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    return sale as unknown as DetailedSale
  }

  async findManyByDateRange(start: Date, end: Date): Promise<DetailedSale[]> {
    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        items: {
          include: {
            service: true,
            product: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    return sales as unknown as DetailedSale[]
  }

  async findManyByUser(userId: string): Promise<DetailedSale[]> {
    const sales = await prisma.sale.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            service: true,
            product: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    return sales as unknown as DetailedSale[]
  }

  async findManyByBarber(barberId: string): Promise<DetailedSale[]> {
    const sales = await prisma.sale.findMany({
      where: { items: { some: { barberId } } },
      include: {
        items: {
          include: {
            service: true,
            product: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    return sales as unknown as DetailedSale[]
  }

  async findManyBySession(sessionId: string): Promise<DetailedSale[]> {
    const sales = await prisma.sale.findMany({
      where: { sessionId },
      include: {
        items: {
          include: {
            service: true,
            product: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    return sales as unknown as DetailedSale[]
  }
}
