import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { ListProductSellersService } from '@/services/users/list-product-sellers'

export function makeListProductSellersService() {
  const repository = new PrismaBarberUsersRepository()
  return new ListProductSellersService(repository)
}
