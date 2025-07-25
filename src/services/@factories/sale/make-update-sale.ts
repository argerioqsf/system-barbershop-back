import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { UpdateSaleService } from '@/services/sale/update-sale'

export function makeUpdateSale() {
  const repository = new PrismaSaleRepository()
  return new UpdateSaleService(repository)
}
