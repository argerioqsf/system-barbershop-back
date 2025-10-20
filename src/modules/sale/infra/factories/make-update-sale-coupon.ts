import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import {
  PrismaCouponRepository,
  PrismaCouponRepository as CouponRepo,
} from '@/repositories/prisma/prisma-coupon-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { PrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'
import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { GetItemBuildService } from '@/services/sale/get-item-build'
import { GetItemsBuildService } from '@/services/sale/get-items-build'
import { UpdateSaleCouponUseCase } from '@/modules/sale/application/use-cases/update-sale-coupon'
import { makeSaleTelemetry } from '@/modules/sale/infra/factories/make-sale-telemetry'

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

  const getItemBuildService = new GetItemBuildService(
    serviceRepository,
    productRepository,
    appointmentRepository,
    couponRepoForItems,
    barberRepository,
    planRepository,
    saleRepository,
    planProfileRepository,
  )

  const getItemsBuildService = new GetItemsBuildService(getItemBuildService)

  const telemetry = makeSaleTelemetry()

  return new UpdateSaleCouponUseCase(
    saleRepository,
    couponRepository,
    barberRepository,
    saleItemRepository,
    getItemsBuildService,
    defaultTransactionRunner,
    telemetry,
  )
}
