import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { CancelPlanProfileService } from '@/services/plan/cancel-plan-profile'

export function makeCancelPlanProfile() {
  const repo = new PrismaPlanProfileRepository()
  return new CancelPlanProfileService(repo)
}
