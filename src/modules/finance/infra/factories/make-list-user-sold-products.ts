import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { ListUserSoldProductsService } from '@/services/users/list-user-sold-products'

export function makeListUserSoldProductsService() {
  const saleRepository = new PrismaSaleRepository()

  return new ListUserSoldProductsService(saleRepository)
}
