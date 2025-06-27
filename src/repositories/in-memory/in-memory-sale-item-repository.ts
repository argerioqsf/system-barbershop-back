import { Prisma, SaleItem } from '@prisma/client'
import { SaleItemRepository } from '../sale-item-repository'
import { InMemorySaleRepository } from './in-memory-sale-repository'

export class InMemorySaleItemRepository implements SaleItemRepository {
  constructor(private saleRepository: InMemorySaleRepository) {}

  async update(
    id: string,
    data: Prisma.SaleItemUpdateInput,
  ): Promise<SaleItem> {
    for (const sale of this.saleRepository.sales) {
      const item = sale.items.find((i) => i.id === id)
      if (item) {
        if (data.porcentagemBarbeiro !== undefined) {
          item.porcentagemBarbeiro = data.porcentagemBarbeiro as number | null
        }
        return item
      }
    }
    throw new Error('Sale item not found')
  }
}
