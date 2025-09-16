import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  SaleRepository,
  DetailedSale,
  DetailedSaleItem,
} from '../sale-repository'

export class PrismaSaleRepository implements SaleRepository {
  private sanitizeUser<T extends { password?: string }>(
    user: T | null,
  ): Omit<T, 'password'> | null {
    if (!user) return null
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...rest } = user
    return rest
  }

  private sanitizeSale(sale: DetailedSale): DetailedSale {
    return {
      ...sale,
      user: this.sanitizeUser(sale.user) as DetailedSale['user'],
      client: this.sanitizeUser(sale.client) as DetailedSale['client'],
      items: sale.items.map((item) => ({
        ...item,
        barber: this.sanitizeUser(item.barber) as DetailedSaleItem['barber'],
      })),
    }
  }

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
    return this.sanitizeSale(detailed)
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
    return detailed.map((sale) => this.sanitizeSale(sale))
  }

  async findManyPaginated(
    where: Prisma.SaleWhereInput,
    page: number,
    perPage: number,
  ): Promise<{ items: DetailedSale[]; count: number }> {
    const [count, sales] = await prisma.$transaction([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ])
    const detailed = sales as DetailedSale[]
    return { items: detailed.map((s) => this.sanitizeSale(s)), count }
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
    return detailed ? this.sanitizeSale(detailed) : null
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
    return this.sanitizeSale(detailed)
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
    return detailed.map((sale) => this.sanitizeSale(sale))
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
    return detailed.map((sale) => this.sanitizeSale(sale))
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
    return detailed.map((sale) => this.sanitizeSale(sale))
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
    return detailed.map((sale) => this.sanitizeSale(sale))
  }
}
