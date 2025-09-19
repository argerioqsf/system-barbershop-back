import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { PrismaOrganizationRepository } from '@/repositories/prisma/prisma-organization-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PrismaBarberServiceRepository } from '@/repositories/prisma/prisma-barber-service-repository'
import { PrismaBarberProductRepository } from '@/repositories/prisma/prisma-barber-product-repository'
import { PrismaAppointmentRepository } from '@/repositories/prisma/prisma-appointment-repository'
import { PaySaleService } from '@/services/sale/pay-sale'
import { PrismaAppointmentServiceRepository } from '@/repositories/prisma/prisma-appointment-service-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { PrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'
import { PrismaTypeRecurrenceRepository } from '@/repositories/prisma/prisma-type-recurrence-repository'

export function makePaySale() {
  const saleRepository = new PrismaSaleRepository()
  const barberUserRepository = new PrismaBarberUsersRepository()
  const cashRegisterRepository = new PrismaCashRegisterRepository()
  const transactionRepository = new PrismaTransactionRepository()
  const organizationRepository = new PrismaOrganizationRepository()
  const profileRepository = new PrismaProfilesRepository()
  const unitRepository = new PrismaUnitRepository()
  const barberServiceRepository = new PrismaBarberServiceRepository()
  const barberProductRepository = new PrismaBarberProductRepository()
  const appointmentRepository = new PrismaAppointmentRepository()
  const appointmentServiceRepository = new PrismaAppointmentServiceRepository()
  const saleItemRepository = new PrismaSaleItemRepository()
  const planProfileRepository = new PrismaPlanProfileRepository()
  const couponRepository = new PrismaCouponRepository()
  const productRepository = new PrismaProductRepository()
  const typeRecurrenceRepository = new PrismaTypeRecurrenceRepository()
  return new PaySaleService(
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
  )
}
