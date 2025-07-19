import { PlanRepository } from '@/repositories/plan-repository'
import { Plan } from '@prisma/client'

interface GetPlanRequest {
  id: string
}

interface GetPlanResponse {
  plan: Plan | null
}

export class GetPlanService {
  constructor(private repository: PlanRepository) {}

  async execute({ id }: GetPlanRequest): Promise<GetPlanResponse> {
    const plan = await this.repository.findById(id)
    return { plan }
  }
}
