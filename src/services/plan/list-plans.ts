import { PlanRepository } from '@/repositories/plan-repository'
import { Plan } from '@prisma/client'

interface ListPlansResponse {
  plans: Plan[]
}

export class ListPlansService {
  constructor(private repository: PlanRepository) {}

  async execute(): Promise<ListPlansResponse> {
    const plans = await this.repository.findMany()
    return { plans }
  }
}
