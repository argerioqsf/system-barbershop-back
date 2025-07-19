import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { UpdatePlanService } from '@/services/plan/update-plan'

export function makeUpdatePlanService() {
  return new UpdatePlanService(new PrismaPlanRepository())
}
