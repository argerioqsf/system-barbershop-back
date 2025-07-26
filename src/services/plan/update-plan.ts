import { PlanRepository } from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Plan, Prisma } from '@prisma/client'
import { RecalculateUserSalesService } from '../sale/recalculate-user-sales'

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
    const planProfiles = await this.planProfileRepository.findMany({
      planId: id,
    })
    const profiles = await Promise.all(
      planProfiles.map((pp) => this.profilesRepository.findById(pp.profileId)),
    )
    const userIds = profiles
      .map((p) => p?.user.id)
      .filter((u): u is string => !!u)

    await this.recalcService.execute({ userIds })

    return { plan }
  }
}
