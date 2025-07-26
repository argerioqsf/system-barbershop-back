import { BenefitRepository } from '@/repositories/benefit-repository'
import { Benefit, Prisma } from '@prisma/client'

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
  constructor(private repository: BenefitRepository) {}

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
    return { benefit }
  }
}
