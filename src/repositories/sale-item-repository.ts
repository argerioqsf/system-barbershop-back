import { Prisma, SaleItem } from '@prisma/client'

export interface SaleItemRepository {
  update(id: string, data: Prisma.SaleItemUpdateInput): Promise<SaleItem>
}
