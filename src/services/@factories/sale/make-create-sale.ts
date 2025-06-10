import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { CreateSaleService } from '@/services/sale/create-sale'

export function makeCreateSale() {
  const repository = new PrismaSaleRepository()
  const serviceRepository = new PrismaServiceRepository()
  const couponRepository = new PrismaCouponRepository()
  const service = new CreateSaleService(repository, serviceRepository, couponRepository)
  return service
}
