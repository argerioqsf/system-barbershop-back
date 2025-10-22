import { PrismaAppointmentRepository } from '@/modules/sale/infra/repositories/prisma/prisma-appointment-repository'
import { PrismaBarberUsersRepository } from '@/modules/sale/infra/repositories/prisma/prisma-barber-users-repository'
import { PrismaCouponRepository } from '@/modules/sale/infra/repositories/prisma/prisma-coupon-repository'
import { PrismaPlanProfileRepository } from '@/modules/sale/infra/repositories/prisma/prisma-plan-profile-repository'
import { PrismaPlanRepository } from '@/modules/sale/infra/repositories/prisma/prisma-plan-repository'
import { PrismaProductRepository } from '@/modules/sale/infra/repositories/prisma/prisma-product-repository'
import { PrismaSaleRepository } from '@/modules/sale/infra/repositories/prisma/prisma-sale-repository'
import { PrismaServiceRepository } from '@/modules/sale/infra/repositories/prisma/prisma-service-repository'
import { SaleItemsBuildService } from '@/modules/sale/application/services/sale-items-build-service'
import { SaleItemBuildItem } from '@/modules/sale/application/dto/sale-item-dto'

export function makeGetItemBuildService() {
  const serviceRepository = new PrismaServiceRepository()
  const productRepository = new PrismaProductRepository()
  const appointmentRepository = new PrismaAppointmentRepository()
  const couponRepository = new PrismaCouponRepository()
  const barberUserRepository = new PrismaBarberUsersRepository()
  const planRepository = new PrismaPlanRepository()
  const saleRepository = new PrismaSaleRepository()
  const planProfileRepository = new PrismaPlanProfileRepository()

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

  return {
    async execute({
      saleItem,
      unitId,
    }: {
      saleItem: SaleItemBuildItem
      unitId: string
    }) {
      const { saleItemsBuild, productsToUpdate } =
        await saleItemsBuildService.buildSaleItemsForUnit([saleItem], unitId)

      return {
        saleItemBuild: saleItemsBuild[0],
        productsToUpdate,
      }
    },
  }
}
