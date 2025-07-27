import { PlanRepository } from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Plan, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { RecalculateUserSalesService } from '../sale/recalculate-user-sales'
import { findUserIdsLinkedToPlans } from './utils/find-user-ids-linked-to-plans'

interface UpdatePlanRequest {
  id: string
  data: Prisma.PlanUpdateInput
  benefitIds?: string[]
}

interface UpdatePlanResponse {
  plan: Plan
}

export class UpdatePlanService {
  constructor(
    private repository: PlanRepository,
    private planProfileRepository: PlanProfileRepository,
    private profilesRepository: ProfilesRepository,
    private recalcService: RecalculateUserSalesService,
  ) {}

  async execute({
    id,
    data,
    benefitIds,
  }: UpdatePlanRequest): Promise<UpdatePlanResponse> {
    const updated: Plan = await this.repository.update(id, {
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

    await prisma.$transaction(async (tx) => {
      const userIds = await findUserIdsLinkedToPlans(
        [id],
        this.planProfileRepository,
        this.profilesRepository,
        tx,
      )

      await this.recalcService.execute({ userIds }, tx)
    })

    return { plan: updated }
  }
}
