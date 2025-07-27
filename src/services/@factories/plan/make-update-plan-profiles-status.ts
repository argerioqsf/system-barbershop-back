import { PrismaPlanProfileRepository } from '@/repositories/prisma/prisma-plan-profile-repository'
import { UpdatePlanProfilesStatusService } from '@/services/plan/update-plan-profiles-status'

export function makeUpdatePlanProfilesStatus() {
  const repo = new PrismaPlanProfileRepository()
  return new UpdatePlanProfilesStatusService(repo)
}
