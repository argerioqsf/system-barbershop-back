import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { CreateSaleService } from '@/services/sale/create-sale'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { PrismaOrganizationRepository } from '@/repositories/prisma/prisma-organization-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'

export function makeCreateSale() {
  const repository = new PrismaSaleRepository()
  const serviceRepository = new PrismaServiceRepository()
  const couponRepository = new PrismaCouponRepository()
  const barberUserRepository = new PrismaBarberUsersRepository()
  const cashRegisterRepository = new PrismaCashRegisterRepository()
  const transactionRepository = new PrismaTransactionRepository()
  const organizationRepository = new PrismaOrganizationRepository()
  const profileRepository = new PrismaProfilesRepository()
  const unitRepository = new PrismaUnitRepository()
  const service = new CreateSaleService(
    repository,
    serviceRepository,
    couponRepository,
    barberUserRepository,
    cashRegisterRepository,
    transactionRepository,
    organizationRepository,
    profileRepository,
    unitRepository,
  )
  return service
}
