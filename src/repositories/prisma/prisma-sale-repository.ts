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
            plan: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
            discounts: true,
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    const detailed = sale as DetailedSale
    return detailed
  }

  async findMany(where: Prisma.SaleWhereInput = {}): Promise<DetailedSale[]> {
    const sales = await prisma.sale.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: {
          include: {
            service: true,
            product: true,
            plan: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
            discounts: true,
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    const detailed = sales as DetailedSale[]
    return detailed
  }

  async findById(id: string): Promise<DetailedSale | null> {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            service: true,
            product: true,
            plan: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
            discounts: true,
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    const detailed = sale as DetailedSale | null
    return detailed
  }

  async update(
    id: string,
    data: Prisma.SaleUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DetailedSale> {
    const prismaClient = tx || prisma
    const sale = await prismaClient.sale.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            service: true,
            product: true,
            plan: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
            discounts: true,
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    const detailed = sale as DetailedSale
    return detailed
  }

  async findManyByDateRange(start: Date, end: Date): Promise<DetailedSale[]> {
    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        items: {
          include: {
            service: true,
            product: true,
            plan: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
            discounts: true,
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    const detailed = sales as DetailedSale[]
    return detailed
  }

  async findManyByUser(userId: string): Promise<DetailedSale[]> {
    const sales = await prisma.sale.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            service: true,
            product: true,
            plan: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
            discounts: true,
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    const detailed = sales as DetailedSale[]
    return detailed
  }

  async findManyByBarber(
    barberId: string,
    where?: Prisma.SaleWhereInput,
  ): Promise<DetailedSale[]> {
    const sales = await prisma.sale.findMany({
      where: { items: { some: { barberId } }, ...where },
      include: {
        items: {
          include: {
            service: true,
            product: true,
            plan: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
            discounts: true,
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    const detailed = sales as DetailedSale[]
    return detailed
  }

  async findManyBySession(sessionId: string): Promise<DetailedSale[]> {
    const sales = await prisma.sale.findMany({
      where: { sessionId },
      include: {
        items: {
          include: {
            service: true,
            product: true,
            plan: true,
            barber: { include: { profile: true } },
            coupon: true,
            appointment: {
              include: { services: { include: { service: true } } },
            },
            discounts: true,
          },
        },
        user: { include: { profile: true } },
        client: { include: { profile: true } },
        coupon: true,
        session: true,
        transactions: true,
      },
    })
    const detailed = sales as DetailedSale[]
    return detailed
  }
}
