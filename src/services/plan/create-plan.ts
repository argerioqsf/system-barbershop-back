import { PlanRepository } from '@/repositories/plan-repository'
import { Plan } from '@prisma/client'

interface CreatePlanRequest {
  name: string
  price: number
  typeRecurrenceId: string
  benefitIds?: string[]
  unitId: string
}

interface CreatePlanResponse {
  plan: Plan
}

export class CreatePlanService {
  constructor(private repository: PlanRepository) {}

  async execute({
    name,
    price,
    typeRecurrenceId,
    benefitIds,
    unitId,
  }: CreatePlanRequest): Promise<CreatePlanResponse> {
    const plan = await this.repository.create({
      name,
      price,
      typeRecurrence: { connect: { id: typeRecurrenceId } },
      unit: { connect: { id: unitId } },
      ...(benefitIds && {
        benefits: {
          create: benefitIds.map((id) => ({ benefit: { connect: { id } } })),
        },
      }),
    })
    return { plan }
  }
}
