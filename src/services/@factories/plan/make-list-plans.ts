import { PrismaPlanRepository } from '@/repositories/prisma/prisma-plan-repository'
import { ListPlansService } from '@/services/plan/list-plans'

export function makeListPlansService() {
  const repository = new PrismaPlanRepository()
  return new ListPlansService(repository)
}
