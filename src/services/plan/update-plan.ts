import { PlanRepository } from '@/repositories/plan-repository'
import { Plan, Prisma } from '@prisma/client'

interface UpdatePlanRequest {
  id: string
  data: Prisma.PlanUpdateInput
}

interface UpdatePlanResponse {
  plan: Plan
}

export class UpdatePlanService {
  constructor(private repository: PlanRepository) {}

  async execute({ id, data }: UpdatePlanRequest): Promise<UpdatePlanResponse> {
    const plan = await this.repository.update(id, data)
    return { plan }
  }
}
