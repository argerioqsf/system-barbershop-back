import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { CreatePlanService } from '@/services/plan/create-plan'

export function makeCreatePlanService() {
  const repository = new PrismaPlanRepository()
  return new CreatePlanService(repository)
}
