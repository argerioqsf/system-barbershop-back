import { BenefitRepository } from '@/repositories/benefit-repository'
import { PlanRepository } from '@/repositories/plan-repository'
import { Benefit, DiscountType } from '@prisma/client'
import { PlanNotFromUserUnitError } from '@/services/@errors/plan/plan-not-from-user-unit-error'
import { ResourceNotFoundError } from '@/services/@errors/common/resource-not-found-error'

interface CreateBenefitRequest {
  name: string
  description?: string | null
  discount: number
  discountType: DiscountType
  categories?: string[]
  services?: string[]
  products?: string[]
  plans?: string[]
  unitId: string
}

interface CreateBenefitResponse {
  benefit: Benefit
}

export class CreateBenefitService {
  constructor(
    private repository: BenefitRepository,
    private planRepository: PlanRepository,
  ) {}

  async execute(data: CreateBenefitRequest): Promise<CreateBenefitResponse> {
    if (data.plans && data.plans.length > 0) {
      for (const planId of data.plans) {
        const plan = await this.planRepository.findById(planId)
        if (!plan) {
          throw new ResourceNotFoundError()
        }
        if (plan.unitId !== data.unitId) {
          throw new PlanNotFromUserUnitError()
        }
      }
    }
    const benefit = await this.repository.create({
      name: data.name,
      description: data.description ?? null,
      discount: data.discount,
      discountType: data.discountType,
      unit: { connect: { id: data.unitId } },
      ...(data.categories && {
        categories: {
          create: data.categories.map((id) => ({
            category: { connect: { id } },
          })),
        },
      }),
      ...(data.services && {
        services: {
          create: data.services.map((id) => ({
            service: { connect: { id } },
          })),
        },
      }),
      ...(data.products && {
        products: {
          create: data.products.map((id) => ({
            product: { connect: { id } },
          })),
        },
      }),
      ...(data.plans && {
        plans: {
          create: data.plans.map((id) => ({
            plan: { connect: { id } },
          })),
        },
      }),
    })
    return { benefit }
  }
}
