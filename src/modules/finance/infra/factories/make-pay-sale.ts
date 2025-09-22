import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaBarberServiceRepository } from '@/repositories/prisma/prisma-barber-service-repository'
import { PrismaBarberProductRepository } from '@/repositories/prisma/prisma-barber-product-repository'
import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { PrismaOrganizationRepository } from '@/repositories/prisma/prisma-organization-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PrismaAppointmentServiceRepository } from '@/repositories/prisma/prisma-appointment-service-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { PrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'
import { PrismaTypeRecurrenceRepository } from '@/repositories/prisma/prisma-type-recurrence-repository'
import { SaleCommissionService } from '@/modules/finance/application/services/sale-commission-service'
import { SaleProfitDistributionService } from '@/modules/finance/application/services/sale-profit-distribution-service'
import { PaySaleUseCase } from '@/modules/finance/application/use-cases/pay-sale'
import { makeSaleTelemetry } from '@/modules/sale/infra/factories/make-sale-telemetry'

export function makePaySaleUseCase() {
  const saleRepository = new PrismaSaleRepository()
  const barberUserRepository = new PrismaBarberUsersRepository()
  const barberServiceRepository = new PrismaBarberServiceRepository()
  const barberProductRepository = new PrismaBarberProductRepository()
  const appointmentRepository = new PrismaAppointmentRepository()
  const cashRegisterRepository = new PrismaCashRegisterRepository()
  const transactionRepository = new PrismaTransactionRepository()
  const organizationRepository = new PrismaOrganizationRepository()
  const profileRepository = new PrismaProfilesRepository()
  const unitRepository = new PrismaUnitRepository()
  const appointmentServiceRepository = new PrismaAppointmentServiceRepository()
  const saleItemRepository = new PrismaSaleItemRepository()
  const planProfileRepository = new PrismaPlanProfileRepository()
  const couponRepository = new PrismaCouponRepository()
  const productRepository = new PrismaProductRepository()
  const typeRecurrenceRepository = new PrismaTypeRecurrenceRepository()

  const saleCommissionService = new SaleCommissionService(
    barberUserRepository,
    barberServiceRepository,
    barberProductRepository,
  )

  const saleProfitDistributionService = new SaleProfitDistributionService(
    organizationRepository,
    profileRepository,
    unitRepository,
    transactionRepository,
    appointmentRepository,
    barberServiceRepository,
    barberProductRepository,
    appointmentServiceRepository,
    saleItemRepository,
  )

  const telemetry = makeSaleTelemetry()

  return new PaySaleUseCase(
    saleRepository,
    barberUserRepository,
    barberServiceRepository,
    barberProductRepository,
    appointmentRepository,
    cashRegisterRepository,
    transactionRepository,
    organizationRepository,
    profileRepository,
    unitRepository,
    appointmentServiceRepository,
    saleItemRepository,
    planProfileRepository,
    couponRepository,
    productRepository,
    typeRecurrenceRepository,
    saleCommissionService,
    saleProfitDistributionService,
    telemetry,
  )
}
