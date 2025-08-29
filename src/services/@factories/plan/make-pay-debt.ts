import { PrismaDebtRepository } from '@/repositories/prisma/prisma-debt-repository'
import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaSaleItemRepository } from '@/repositories/prisma/prisma-sale-item-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PayDebtService } from '@/services/plan/pay-debt'
import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { makeRecalculateUserSalesService } from '@/services/@factories/sale/make-recalculate-user-sales'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'

export function makePayDebtService() {
  const planRepo = new PrismaPlanRepository()
  const recalcService = makeRecalculateUserSalesService()
  const profilesRepo = new PrismaProfilesRepository()
  return new PayDebtService(
    new PrismaDebtRepository(),
    new PrismaPlanProfileRepository(),
    new PrismaSaleItemRepository(),
    new PrismaUnitRepository(),
    planRepo,
    recalcService,
    profilesRepo,
  )
}
