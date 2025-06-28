import { prisma } from '@/lib/prisma'
import { Prisma, SaleItem } from '@prisma/client'
import { SaleItemRepository } from '../sale-item-repository'

export class PrismaSaleItemRepository implements SaleItemRepository {
  async update(
    id: string,
    data: Prisma.AppointmentUpdateInput,
  ): Promise<SaleItem> {
    return prisma.saleItem.update({ where: { id }, data })
  }
}
