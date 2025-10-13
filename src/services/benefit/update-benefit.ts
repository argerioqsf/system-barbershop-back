import { BenefitRepository } from '@/repositories/benefit-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { PlanProfileRepository } from '@/repositories/plan-profile-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Benefit, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { RecalculateUserSalesService } from '@/modules/sale/application/use-cases/recalculate-user-sales'
import { findUserIdsLinkedToPlans } from '../plan/utils/find-user-ids-linked-to-plans'
import { PlanNotFromUserUnitError } from '@/services/@errors/plan/plan-not-from-user-unit-error'
import { ResourceNotFoundError } from '@/services/@errors/common/resource-not-found-error'

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

  private async checkIfNeedToUpdateSales(benefitId: string) {
    await prisma.$transaction(async (tx) => {
      const plansList = await this.planRepository.findMany(
        { benefits: { some: { benefitId } } },
        tx,
      )
      const planIds = plansList.map((p) => p.id)

      const userIds = await findUserIdsLinkedToPlans(
        planIds,
        this.planProfileRepository,
        this.profilesRepository,
        tx,
      )

      await this.recalcService.execute({ userIds }, tx)
    })
  }

  async execute({
    id,
    data,
    categories,
    services,
    products,
    plans,
  }: UpdateBenefitRequest): Promise<UpdateBenefitResponse> {
    const current = await this.repository.findById(id)
    if (!current) {
      throw new ResourceNotFoundError()
    }

    if (plans && plans.length > 0) {
      for (const planId of plans) {
        const plan = await this.planRepository.findById(planId)
        if (!plan) {
          throw new ResourceNotFoundError()
        }
        if (plan.unitId !== current.unitId) {
          throw new PlanNotFromUserUnitError()
        }
      }
    }

    const updated: Benefit = await this.repository.update(id, {
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

    await this.checkIfNeedToUpdateSales(id)

    return { benefit: updated }
  }
}
