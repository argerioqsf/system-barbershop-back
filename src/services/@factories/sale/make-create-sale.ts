import { PrismaSaleRepository } from '@/repositories/prisma/prisma-sale-repository'
import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { PrismaProductRepository } from '@/repositories/prisma/prisma-product-repository'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'
import { CreateSaleService } from '@/services/sale/create-sale'
import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaBarberServiceRepository } from '@/repositories/prisma/prisma-barber-service-repository'
import { PrismaBarberProductRepository } from '@/repositories/prisma/prisma-barber-product-repository'
import { PrismaCashRegisterRepository } from '@/repositories/prisma/prisma-cash-register-repository'
import { PrismaTransactionRepository } from '@/repositories/prisma/prisma-transaction-repository'
import { PrismaOrganizationRepository } from '@/repositories/prisma/prisma-organization-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'

export function makeCreateSale() {
  const repository = new PrismaSaleRepository()
  const serviceRepository = new PrismaServiceRepository()
  const productRepository = new PrismaProductRepository()
  const couponRepository = new PrismaCouponRepository()
  const barberUserRepository = new PrismaBarberUsersRepository()
  const barberServiceRepository = new PrismaBarberServiceRepository()
  const barberProductRepository = new PrismaBarberProductRepository()
  const cashRegisterRepository = new PrismaCashRegisterRepository()
  const transactionRepository = new PrismaTransactionRepository()
  const organizationRepository = new PrismaOrganizationRepository()
  const profileRepository = new PrismaProfilesRepository()
  const unitRepository = new PrismaUnitRepository()
  const service = new CreateSaleService(
    repository,
    serviceRepository,
    productRepository,
    couponRepository,
    barberUserRepository,
    barberServiceRepository,
    barberProductRepository,
    cashRegisterRepository,
    transactionRepository,
    organizationRepository,
    profileRepository,
    unitRepository,
  )
  return service
}
