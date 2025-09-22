import { prisma } from '@/lib/prisma'
import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { PrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'
import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import {
  RemoveAddSaleItemUseCase,
  TransactionRunner,
} from '@/modules/sale/application/use-cases/remove-add-sale-item'
import { SaleItemsBuildService } from '@/modules/sale/application/services/sale-items-build-service'
import { makeSaleTelemetry } from '@/modules/sale/infra/factories/make-sale-telemetry'

export function makeRemoveAddSaleItem() {
  const saleRepository = new PrismaSaleRepository()
  const productRepository = new PrismaProductRepository()
  const appointmentRepository = new PrismaAppointmentRepository()
  const couponRepository = new PrismaCouponRepository()
  const barberUserRepository = new PrismaBarberUsersRepository()
  const saleItemRepository = new PrismaSaleItemRepository()
  const planRepository = new PrismaPlanRepository()
  const planProfileRepository = new PrismaPlanProfileRepository()
  const serviceRepository = new PrismaServiceRepository()
  const runInTransaction: TransactionRunner = (fn) => prisma.$transaction(fn)

  const saleItemsBuildService = new SaleItemsBuildService({
    serviceRepository,
    productRepository,
    appointmentRepository,
    couponRepository,
    barberUserRepository,
    planRepository,
    saleRepository,
    planProfileRepository,
  })

  const telemetry = makeSaleTelemetry()

  return new RemoveAddSaleItemUseCase(
    saleRepository,
    productRepository,
    appointmentRepository,
    barberUserRepository,
    saleItemRepository,
    saleItemsBuildService,
    runInTransaction,
    telemetry,
  )
}
