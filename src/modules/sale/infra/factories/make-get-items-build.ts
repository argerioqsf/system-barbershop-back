import { PrismaServiceRepository } from '@/modules/sale/infra/repositories/prisma/prisma-service-repository'
import { PrismaProductRepository } from '@/modules/sale/infra/repositories/prisma/prisma-product-repository'
import { PrismaAppointmentRepository } from '@/modules/sale/infra/repositories/prisma/prisma-appointment-repository'
import { PrismaCouponRepository } from '@/modules/sale/infra/repositories/prisma/prisma-coupon-repository'
import { PrismaBarberUsersRepository } from '@/modules/sale/infra/repositories/prisma/prisma-barber-users-repository'
import { PrismaPlanRepository } from '@/modules/sale/infra/repositories/prisma/prisma-plan-repository'
import { PrismaSaleRepository } from '@/modules/sale/infra/repositories/prisma/prisma-sale-repository'
import { PrismaPlanProfileRepository } from '@/modules/sale/infra/repositories/prisma/prisma-plan-profile-repository'
import { SaleItemsBuildService } from '@/modules/sale/application/services/sale-items-build-service'
import { GetItemsBuildRequest } from '@/modules/sale/application/dto/sale'

export function makeGetItemsBuildService() {
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
    async execute({ saleItems, unitId }: GetItemsBuildRequest) {
      const { saleItemsBuild, productsToUpdate } =
        await saleItemsBuildService.buildSaleItemsForUnit(saleItems, unitId)

      const newAppointmentsToLink = saleItems
        .map((item) => item.appointmentId)
        .filter((id): id is string => Boolean(id))

      return {
        saleItemsBuild,
        newAppointmentsToLink,
        productsToUpdate,
      }
    },
  }
}
