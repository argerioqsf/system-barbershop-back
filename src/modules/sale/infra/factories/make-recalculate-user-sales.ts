import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { PrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'
import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { RecalculateUserSalesService } from '@/modules/sale/application/use-cases/recalculate-user-sales'
import { SaleItemsBuildService } from '@/modules/sale/application/services/sale-items-build-service'

export function makeRecalculateUserSales() {
  const saleRepository = new PrismaSaleRepository()
  const saleItemRepository = new PrismaSaleItemRepository()
  const planRepository = new PrismaPlanRepository()
  const planProfileRepository = new PrismaPlanProfileRepository()
  const couponRepository = new PrismaCouponRepository()
  const serviceRepository = new PrismaServiceRepository()
  const productRepository = new PrismaProductRepository()
  const appointmentRepository = new PrismaAppointmentRepository()
  const barberRepository = new PrismaBarberUsersRepository()

  const saleItemsBuildService = new SaleItemsBuildService({
    serviceRepository,
    productRepository,
    appointmentRepository,
    couponRepository,
    barberUserRepository: barberRepository,
    planRepository,
    saleRepository,
    planProfileRepository,
  })

  return new RecalculateUserSalesService(
    saleRepository,
    saleItemRepository,
    saleItemsBuildService,
  )
}
