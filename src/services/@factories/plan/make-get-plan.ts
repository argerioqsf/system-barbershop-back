import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { GetPlanService } from '@/services/plan/get-plan'

export function makeGetPlanService() {
  return new GetPlanService(new PrismaPlanRepository())
}
