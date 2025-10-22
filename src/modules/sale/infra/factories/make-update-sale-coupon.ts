import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { PrismaSaleRepository } from '@/modules/sale/infra/repositories/prisma/prisma-sale-repository'
import {
  PrismaCouponRepository,
  PrismaCouponRepository as CouponRepo,
} from '@/modules/sale/infra/repositories/prisma/prisma-coupon-repository'
import { PrismaBarberUsersRepository } from '@/modules/sale/infra/repositories/prisma/prisma-barber-users-repository'
import { PrismaSaleItemRepository } from '@/modules/sale/infra/repositories/prisma/prisma-sale-item-repository'
import { PrismaServiceRepository } from '@/modules/sale/infra/repositories/prisma/prisma-service-repository'
import { PrismaProductRepository } from '@/modules/sale/infra/repositories/prisma/prisma-product-repository'
import { PrismaAppointmentRepository } from '@/modules/sale/infra/repositories/prisma/prisma-appointment-repository'
import { PrismaPlanRepository } from '@/modules/sale/infra/repositories/prisma/prisma-plan-repository'
import { PrismaPlanProfileRepository } from '@/modules/sale/infra/repositories/prisma/prisma-plan-profile-repository'
import { UpdateSaleCouponUseCase } from '@/modules/sale/application/use-cases/update-sale-coupon'
import { makeSaleTelemetry } from '@/modules/sale/infra/factories/make-sale-telemetry'
import { SaleItemsBuildService } from '@/modules/sale/application/services/sale-items-build-service'

export function makeUpdateSaleCoupon() {
  const saleRepository = new PrismaSaleRepository()
  const couponRepository = new PrismaCouponRepository()
  const barberRepository = new PrismaBarberUsersRepository()
  const saleItemRepository = new PrismaSaleItemRepository()

  const serviceRepository = new PrismaServiceRepository()
  const productRepository = new PrismaProductRepository()
  const appointmentRepository = new PrismaAppointmentRepository()
  const planRepository = new PrismaPlanRepository()
  const planProfileRepository = new PrismaPlanProfileRepository()
  const couponRepoForItems = new CouponRepo()

  const saleItemsBuildService = new SaleItemsBuildService({
    serviceRepository,
    productRepository,
    appointmentRepository,
    couponRepository: couponRepoForItems,
    barberUserRepository: barberRepository,
    planRepository,
    saleRepository,
    planProfileRepository,
  })

  const telemetry = makeSaleTelemetry()

  return new UpdateSaleCouponUseCase(
    saleRepository,
    couponRepository,
    barberRepository,
    saleItemRepository,
    saleItemsBuildService,
    defaultTransactionRunner,
    telemetry,
  )
}
