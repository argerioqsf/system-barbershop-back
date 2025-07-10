import {
  Plan,
  Prisma,
  Benefit,
  BenefitPlan,
  BenefitCategory,
  BenefitService,
  BenefitProduct,
} from '@prisma/client'

export type PlanWithBenefits = Plan & {
  benefits: (BenefitPlan & {
    benefit: Benefit & {
      categories: BenefitCategory[]
      services: BenefitService[]
      products: BenefitProduct[]
    }
  })[]
}

export interface PlanRepository {
  findById(id: string): Promise<Plan | null>
  findByIdWithBenefits(id: string): Promise<PlanWithBenefits | null>
  findByIdWithRecurrence(
    id: string,
  ): Promise<(Plan & { typeRecurrence: { period: number } }) | null>
  create(data: Prisma.PlanCreateInput): Promise<Plan>
  update(id: string, data: Prisma.PlanUpdateInput): Promise<Plan>
  findMany(where?: Prisma.PlanWhereInput): Promise<Plan[]>
}
