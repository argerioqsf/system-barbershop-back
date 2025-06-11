import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { CreateSaleService } from '@/services/sale/create-sale'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'

export function makeCreateSale() {
  const repository = new PrismaSaleRepository()
  const serviceRepository = new PrismaServiceRepository()
  const couponRepository = new PrismaCouponRepository()
  const barberUserRepository = new PrismaBarberUsersRepository()
  const service = new CreateSaleService(
    repository,
    serviceRepository,
    couponRepository,
    barberUserRepository,
  )
  return service
}
