import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { CancelOverduePlanProfilesService } from '@/services/plan/cancel-overdue-plan-profiles'

export function makeCancelOverduePlanProfiles() {
  const repo = new PrismaPlanProfileRepository()
  return new CancelOverduePlanProfilesService(repo)
}
