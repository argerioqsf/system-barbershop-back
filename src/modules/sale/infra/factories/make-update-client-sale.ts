import { defaultTransactionRunner } from '@/infra/prisma/transaction-runner'
import { PrismaSaleRepository } from '@/modules/sale/infra/repositories/prisma/prisma-sale-repository'
import { PrismaProfilesRepository } from '@/modules/sale/infra/repositories/prisma/prisma-profiles-repository'
import { PrismaSaleItemRepository } from '@/modules/sale/infra/repositories/prisma/prisma-sale-item-repository'
import { PrismaPlanRepository } from '@/modules/sale/infra/repositories/prisma/prisma-plan-repository'
import { PrismaPlanProfileRepository } from '@/modules/sale/infra/repositories/prisma/prisma-plan-profile-repository'
import { PrismaServiceRepository } from '@/modules/sale/infra/repositories/prisma/prisma-service-repository'
import { PrismaProductRepository } from '@/modules/sale/infra/repositories/prisma/prisma-product-repository'
import { PrismaAppointmentRepository } from '@/modules/sale/infra/repositories/prisma/prisma-appointment-repository'
import { PrismaCouponRepository } from '@/modules/sale/infra/repositories/prisma/prisma-coupon-repository'
import { PrismaBarberUsersRepository } from '@/modules/sale/infra/repositories/prisma/prisma-barber-users-repository'
import { UpdateSaleClientUseCase } from '@/modules/sale/application/use-cases/update-sale-client'
import { makeSaleTelemetry } from '@/modules/sale/infra/factories/make-sale-telemetry'
import { SaleItemsBuildService } from '@/modules/sale/application/services/sale-items-build-service'

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

  const telemetry = makeSaleTelemetry()

  return new UpdateSaleClientUseCase(
    saleRepository,
    profileRepository,
    saleItemRepository,
    planRepository,
    planProfileRepository,
    saleItemsBuildService,
    defaultTransactionRunner,
    telemetry,
  )
}
