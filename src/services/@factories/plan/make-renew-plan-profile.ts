import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { PrismaDebtRepository } from '@/repositories/prisma/prisma-debt-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { makeRecalculateUserSales } from '@/modules/sale/infra/factories/make-recalculate-user-sales'
import { RenewPlanProfileService } from '@/services/plan/renew-plan-profile'

export function makeRenewPlanProfileService() {
  const planProfileRepo = new PrismaPlanProfileRepository()
  const planRepo = new PrismaPlanRepository()
  const debtRepo = new PrismaDebtRepository()
  const profilesRepo = new PrismaProfilesRepository()
  const recalcService = makeRecalculateUserSales()
  return new RenewPlanProfileService(
    planProfileRepo,
    planRepo,
    debtRepo,
    profilesRepo,
    recalcService,
  )
}
