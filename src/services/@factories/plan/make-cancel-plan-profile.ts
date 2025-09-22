import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { CancelPlanProfileService } from '@/services/plan/cancel-plan-profile'
import { makeRecalculateUserSales } from '@/modules/sale/infra/factories/make-recalculate-user-sales'

export function makeCancelPlanProfile() {
  const repo = new PrismaPlanProfileRepository()
  const profilesRepo = new PrismaProfilesRepository()
  const recalcService = makeRecalculateUserSales()
  return new CancelPlanProfileService(repo, profilesRepo, recalcService)
}
