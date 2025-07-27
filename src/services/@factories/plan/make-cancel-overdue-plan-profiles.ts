import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { CancelOverduePlanProfilesService } from '@/services/plan/cancel-overdue-plan-profiles'
import { makeRecalculateUserSalesService } from '@/services/@factories/sale/make-recalculate-user-sales'

export function makeCancelOverduePlanProfiles() {
  const repo = new PrismaPlanProfileRepository()
  const profilesRepo = new PrismaProfilesRepository()
  const recalcService = makeRecalculateUserSalesService()
  return new CancelOverduePlanProfilesService(repo, profilesRepo, recalcService)
}
