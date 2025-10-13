import { prisma } from '@/lib/prisma'
import { PaymentStatus, Prisma, SaleItem } from '@prisma/client'
import {
  DetailedSaleItemFindById,
  DetailedSaleItemFindMany,
  ReturnFindManyPendingCommission,
  SaleItemRepository,
} from '../sale-item-repository'
export class PrismaSaleItemRepository implements SaleItemRepository {
  async update(
    id: string,
    data: Prisma.SaleItemUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<SaleItem> {
    const prismaClient = tx || prisma
    return prismaClient.saleItem.update({ where: { id }, data })
  }

  async updateManyIndividually(
    updates: { id: string; data: Prisma.SaleItemUpdateInput }[],
    tx: Prisma.TransactionClient,
  ): Promise<SaleItem[]> {
    const prismaClient = tx

    const updatePromises = updates.map(({ id, data }) =>
      prismaClient.saleItem.update({
        where: { id },
        data,
      }),
    )

    return Promise.all(updatePromises)
  }

  async findById(id: string): Promise<DetailedSaleItemFindById | null> {
    return prisma.saleItem.findUnique({
      where: { id },
      include: {
        sale: true,
        transactions: true,
        discounts: true,
        appointment: {
          include: {
            services: { include: { service: true, transactions: true } },
          },
        },
      },
    })
  }

  async findMany(
    where: Prisma.SaleItemWhereInput = {},
  ): Promise<DetailedSaleItemFindMany[]> {
    return prisma.saleItem.findMany({
      where,
      include: {
        sale: true,
        transactions: true,
        appointment: {
          include: {
            services: {
              include: { service: true, transactions: true },
            },
          },
        },
        discounts: true,
      },
    })
  }

  async findManyPendingCommissionForIds(
    barberId: string,
    appointmentServiceIds?: string[],
    saleItemIds?: string[],
  ): Promise<ReturnFindManyPendingCommission[]> {
    return prisma.saleItem.findMany({
      where: {
        barberId,
        commissionPaid: false,
        sale: {
          paymentStatus: PaymentStatus.PAID,
        },
        AND: [
          {
            ...(saleItemIds &&
              saleItemIds.length > 0 && { id: { in: saleItemIds } }),
          },
          {
            ...(appointmentServiceIds &&
              appointmentServiceIds.length > 0 && {
                appointment: {
                  services: {
                    some: {
                      id: { in: appointmentServiceIds },
                    },
                  },
                },
              }),
          },
        ],
      },
      include: {
        sale: true,
        transactions: true,
        appointment: {
          include: {
            services: {
              where: { id: { in: appointmentServiceIds } },
              include: { service: true, transactions: true },
            },
          },
        },
        discounts: true,
        service: true,
        product: true,
      },
    })
  }

  async findManyByBarberId(
    barberId: string,
  ): Promise<DetailedSaleItemFindMany[]> {
    return prisma.saleItem.findMany({
      where: {
        barberId,
        sale: {
          paymentStatus: 'PAID',
        },
      },
      include: {
        sale: true,
        transactions: true,
        appointment: {
          include: {
            services: {
              include: { service: true, transactions: true },
            },
          },
        },
        discounts: true,
      },
    })
  }

  async findManyPendingCommission(
    barberId: string,
  ): Promise<ReturnFindManyPendingCommission[]> {
    return prisma.saleItem.findMany({
      where: {
        barberId,
        commissionPaid: false,
        sale: {
          paymentStatus: PaymentStatus.PAID,
        },
        OR: [
          { appointmentId: { not: null } },
          { serviceId: { not: null } },
          { productId: { not: null } },
        ],
      },
      include: {
        sale: true,
        transactions: true,
        appointment: {
          include: {
            services: {
              where: { commissionPaid: false }, // <-- filtra APENAS os services pendentes
              include: {
                service: true,
                transactions: true,
              },
            },
          },
        },
        discounts: true,
        service: true,
        product: true,
      },
    })
  }
}
