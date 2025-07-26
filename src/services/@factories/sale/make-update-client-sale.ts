import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { UpdateClientSaleService } from '@/services/sale/update-client-sale'
import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { PrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'
import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'

export function makeUpdateClientSale() {
  const repository = new PrismaSaleRepository()
  const profileRepository = new PrismaProfilesRepository()
  const saleItemRepository = new PrismaSaleItemRepository()
  const planRepository = new PrismaPlanRepository()
  const planProfileRepository = new PrismaPlanProfileRepository()
  const serviceRepository = new PrismaServiceRepository()
  const productRepository = new PrismaProductRepository()
  const appointmentRepository = new PrismaAppointmentRepository()
  const couponRepository = new PrismaCouponRepository()
  const barberUserRepository = new PrismaBarberUsersRepository()
  return new UpdateClientSaleService(
    repository,
    profileRepository,
    saleItemRepository,
    planRepository,
    planProfileRepository,
    serviceRepository,
    productRepository,
    appointmentRepository,
    couponRepository,
    barberUserRepository,
  )
}
