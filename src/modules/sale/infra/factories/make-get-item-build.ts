import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { PrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'
import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { GetItemBuildService } from '@/services/sale/get-item-build'

export function makeGetItemBuildService() {
  const serviceRepository = new PrismaServiceRepository()
  const productRepository = new PrismaProductRepository()
  const appointmentRepository = new PrismaAppointmentRepository()
  const couponRepository = new PrismaCouponRepository()
  const barberUserRepository = new PrismaBarberUsersRepository()
  const planRepository = new PrismaPlanRepository()
  const saleRepository = new PrismaSaleRepository()
  const planProfileRepository = new PrismaPlanProfileRepository()

  return new GetItemBuildService(
    serviceRepository,
    productRepository,
    appointmentRepository,
    couponRepository,
    barberUserRepository,
    planRepository,
    saleRepository,
    planProfileRepository,
  )
}

