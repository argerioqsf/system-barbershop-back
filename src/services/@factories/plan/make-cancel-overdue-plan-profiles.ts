import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { CancelOverduePlanProfilesService } from '@/services/plan/cancel-overdue-plan-profiles'

export function makeCancelOverduePlanProfiles() {
  const repo = new PrismaPlanProfileRepository()
  const planRepo = new PrismaPlanRepository()
  return new CancelOverduePlanProfilesService(repo, planRepo)
}
