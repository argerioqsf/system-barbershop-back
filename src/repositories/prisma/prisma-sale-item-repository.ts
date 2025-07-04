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
  ): Promise<SaleItem> {
    return prisma.saleItem.update({ where: { id }, data })
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
