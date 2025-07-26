import { BenefitRepository } from '@/repositories/benefit-repository'
import { Benefit, DiscountType } from '@prisma/client'

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
  constructor(private repository: BenefitRepository) {}

  async execute(data: CreateBenefitRequest): Promise<CreateBenefitResponse> {
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
