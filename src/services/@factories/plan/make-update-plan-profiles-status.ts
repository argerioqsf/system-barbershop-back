import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { UpdatePlanProfilesStatusService } from '@/services/plan/update-plan-profiles-status'
import { makeRecalculateUserSales } from '@/modules/sale/infra/factories/make-recalculate-user-sales'

export function makeUpdatePlanProfilesStatus() {
  const repo = new PrismaPlanProfileRepository()
  const profilesRepo = new PrismaProfilesRepository()
  const recalcService = makeRecalculateUserSales()
  return new UpdatePlanProfilesStatusService(repo, profilesRepo, recalcService)
}
