import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { PrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'
import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { UpdateCouponSaleItemService } from '@/services/sale/update-coupon-sale-item'

export function makeUpdateCouponSaleItem() {
  const repository = new PrismaSaleItemRepository()
  const serviceRepository = new PrismaServiceRepository()
  const productRepository = new PrismaProductRepository()
  const appointmentRepository = new PrismaAppointmentRepository()
  const couponRepository = new PrismaCouponRepository()
  const barberUserRepository = new PrismaBarberUsersRepository()
  const saleRepository = new PrismaSaleRepository()
  const planRepository = new PrismaPlanRepository()
  const planProfileRepository = new PrismaPlanProfileRepository()
  return new UpdateCouponSaleItemService(
    repository,
    serviceRepository,
    productRepository,
    appointmentRepository,
    couponRepository,
    barberUserRepository,
    saleRepository,
    planRepository,
    planProfileRepository,
  )
}
