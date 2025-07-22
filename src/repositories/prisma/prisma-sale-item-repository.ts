import { prisma } from '@/lib/prisma'
import { Prisma, SaleItem } from '@prisma/client'
import {
  DetailedSaleItemFindMany,
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

  async findById(id: string): Promise<DetailedSaleItemFindMany | null> {
    return prisma.saleItem.findUnique({
      where: { id },
      include: {
        sale: true,
        transactions: true,
        appointment: {
          include: {
            services: { include: { service: true, transactions: true } },
          },
        },
      },
    }) as Promise<DetailedSaleItemFindMany | null>
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
      },
    })
  }

  async findManyFilterAppointmentService(
    where: Prisma.SaleItemWhereInput = {},
    appointmentServiceIds?: string[],
  ): Promise<DetailedSaleItemFindMany[]> {
    return prisma.saleItem.findMany({
      where,
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
      },
    })
  }
}
