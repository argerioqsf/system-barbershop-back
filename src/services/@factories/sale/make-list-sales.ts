import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { ListSalesService } from '@/services/sale/list-sales'

export function makeListSales() {
  const repository = new PrismaSaleRepository()
  const service = new ListSalesService(repository)
  return service
}
