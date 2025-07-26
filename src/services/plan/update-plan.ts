import { PlanRepository } from '@/repositories/plan-repository'
import { Plan, Prisma } from '@prisma/client'

interface UpdatePlanRequest {
  id: string
  data: Prisma.PlanUpdateInput
  benefitIds?: string[]
}

interface UpdatePlanResponse {
  plan: Plan
}

export class UpdatePlanService {
  constructor(private repository: PlanRepository) {}

  async execute({
    id,
    data,
    benefitIds,
  }: UpdatePlanRequest): Promise<UpdatePlanResponse> {
    const plan = await this.repository.update(id, {
      ...data,
      ...(benefitIds && {
        benefits: {
          deleteMany: {},
          create: benefitIds.map((bid) => ({
            benefit: { connect: { id: bid } },
          })),
        },
      }),
    })
    return { plan }
  }
}
