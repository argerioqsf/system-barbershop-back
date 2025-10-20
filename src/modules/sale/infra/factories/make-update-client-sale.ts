import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { PrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'
import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { GetItemBuildService } from '@/services/sale/get-item-build'
import { GetItemsBuildService } from '@/services/sale/get-items-build'
import { UpdateSaleClientUseCase } from '@/modules/sale/application/use-cases/update-sale-client'
import { makeSaleTelemetry } from '@/modules/sale/infra/factories/make-sale-telemetry'

export function makeUpdateClientSale() {
  const saleRepository = new PrismaSaleRepository()
  const profileRepository = new PrismaProfilesRepository()
  const saleItemRepository = new PrismaSaleItemRepository()
  const planRepository = new PrismaPlanRepository()
  const planProfileRepository = new PrismaPlanProfileRepository()
  const serviceRepository = new PrismaServiceRepository()
  const productRepository = new PrismaProductRepository()
  const appointmentRepository = new PrismaAppointmentRepository()
  const couponRepository = new PrismaCouponRepository()
  const barberRepository = new PrismaBarberUsersRepository()

  const getItemBuildService = new GetItemBuildService(
    serviceRepository,
    productRepository,
    appointmentRepository,
    couponRepository,
    barberRepository,
    planRepository,
    saleRepository,
    planProfileRepository,
  )

  const getItemsBuildService = new GetItemsBuildService(getItemBuildService)

  const telemetry = makeSaleTelemetry()

  return new UpdateSaleClientUseCase(
    saleRepository,
    profileRepository,
    saleItemRepository,
    planRepository,
    planProfileRepository,
    getItemsBuildService,
    defaultTransactionRunner,
    telemetry,
  )
}
