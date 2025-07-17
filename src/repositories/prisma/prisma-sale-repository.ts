import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { computeDiscountInfo } from '@/services/sale/utils/discount'
import {
  SaleRepository,
  DetailedSale,
  DetailedSaleItem,
} from '../sale-repository'

export class PrismaSaleRepository implements SaleRepository {
  private addDiscountInfo(sales: DetailedSale | DetailedSale[]): void {
    const list = Array.isArray(sales) ? sales : [sales]
    for (const sale of list) {
      for (const item of sale.items) {
        const info = computeDiscountInfo(item.price, item.discounts)
        const typedItem = item as DetailedSaleItem
        typedItem.discount = info.discount
        typedItem.discountType = info.discountType
      }
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
    this.addDiscountInfo(detailed)
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
    this.addDiscountInfo(detailed)
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
    if (detailed) this.addDiscountInfo(detailed)
    return detailed
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
    this.addDiscountInfo(detailed)
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
    this.addDiscountInfo(detailed)
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
    this.addDiscountInfo(detailed)
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
    this.addDiscountInfo(detailed)
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
    this.addDiscountInfo(detailed)
    return detailed
  }
}
