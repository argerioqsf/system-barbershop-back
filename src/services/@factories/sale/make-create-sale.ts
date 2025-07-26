import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { CreateSaleService } from '@/services/sale/create-sale'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'

export function makeCreateSale() {
  const repository = new PrismaSaleRepository()
  const barberUserRepository = new PrismaBarberUsersRepository()
  const service = new CreateSaleService(repository, barberUserRepository)
  return service
}
