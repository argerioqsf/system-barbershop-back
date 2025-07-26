import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { DeletePlanService } from '@/services/plan/delete-plan'

export function makeDeletePlanService() {
  return new DeletePlanService(new PrismaPlanRepository())
}
