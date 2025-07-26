import { BenefitRepository } from '@/repositories/benefit-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import {
  PlanProfileRepository,
  PlanProfileWithDebts,
} from '@/repositories/plan-profile-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Benefit, Prisma } from '@prisma/client'
import { RecalculateUserSalesService } from '../sale/recalculate-user-sales'

interface UpdateBenefitRequest {
  id: string
  data: Prisma.BenefitUpdateInput
  categories?: string[]
  services?: string[]
  products?: string[]
  plans?: string[]
}

interface UpdateBenefitResponse {
  benefit: Benefit
}

export class UpdateBenefitService {
  constructor(
    private repository: BenefitRepository,
    private planRepository: PlanRepository,
    private planProfileRepository: PlanProfileRepository,
    private profilesRepository: ProfilesRepository,
    private recalcService: RecalculateUserSalesService,
  ) {}

  async execute({
    id,
    data,
    categories,
    services,
    products,
    plans,
  }: UpdateBenefitRequest): Promise<UpdateBenefitResponse> {
    const benefit = await this.repository.update(id, {
      ...data,
      ...(categories && {
        categories: {
          deleteMany: {},
          create: categories.map((cid) => ({
            category: { connect: { id: cid } },
          })),
        },
      }),
      ...(services && {
        services: {
          deleteMany: {},
          create: services.map((sid) => ({
            service: { connect: { id: sid } },
          })),
        },
      }),
      ...(products && {
        products: {
          deleteMany: {},
          create: products.map((pid) => ({
            product: { connect: { id: pid } },
          })),
        },
      }),
      ...(plans && {
        plans: {
          deleteMany: {},
          create: plans.map((pid) => ({ plan: { connect: { id: pid } } })),
        },
      }),
    })
    const plansList = await this.planRepository.findMany({
      benefits: { some: { benefitId: id } },
    })
    const planIds = plansList.map((p) => p.id)
    let planProfiles: PlanProfileWithDebts[] = []
    for (const pid of planIds) {
      const profilesPart = await this.planProfileRepository.findMany({
        planId: pid,
      })
      planProfiles = planProfiles.concat(profilesPart)
    }
    const uniqueProfileIds = Array.from(
      new Set(planProfiles.map((pp) => pp.profileId)),
    )
    const profiles = await Promise.all(
      uniqueProfileIds.map((pid) => this.profilesRepository.findById(pid)),
    )
    const userIds = profiles
      .map((p) => p?.user.id)
      .filter((u): u is string => !!u)

    await this.recalcService.execute({ userIds })

    return { benefit }
  }
}
