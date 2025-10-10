import { logger } from '@/lib/logger'
import { PlanRepository } from '@/repositories/plan-repository'
import { Plan, Prisma } from '@prisma/client'

interface ListPlansRequest {
  unitId: string
  where?: Prisma.PlanWhereInput
}

interface ListPlansResponse {
  plans: Plan[]
}

export class ListPlansService {
  constructor(private repository: PlanRepository) {}

  async execute({
    unitId,
    where,
  }: ListPlansRequest): Promise<ListPlansResponse> {
    const filters: Prisma.PlanWhereInput = {
      ...(where ?? {}),
      unitId,
    }
    logger.debug('Listing plans', { filters })
    const plans = await this.repository.findMany(filters)
    return { plans }
  }
}
