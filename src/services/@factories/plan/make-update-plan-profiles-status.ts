import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { UpdatePlanProfilesStatusService } from '@/services/plan/update-plan-profiles-status'
import { makeRecalculateUserSalesService } from '@/services/@factories/sale/make-recalculate-user-sales'

export function makeUpdatePlanProfilesStatus() {
  const repo = new PrismaPlanProfileRepository()
  const profilesRepo = new PrismaProfilesRepository()
  const recalcService = makeRecalculateUserSalesService()
  return new UpdatePlanProfilesStatusService(repo, profilesRepo, recalcService)
}
