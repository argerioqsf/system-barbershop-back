import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { GetSaleService } from '@/services/sale/get-sale'

export function makeGetSale() {
  const repository = new PrismaSaleRepository()
  const service = new GetSaleService(repository)
  return service
}
