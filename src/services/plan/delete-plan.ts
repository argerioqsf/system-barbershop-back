import { PlanRepository } from '@/repositories/plan-repository'

interface DeletePlanRequest {
  id: string
}

export class DeletePlanService {
  constructor(private repository: PlanRepository) {}

  async execute({ id }: DeletePlanRequest): Promise<void> {
    await this.repository.delete(id)
  }
}
