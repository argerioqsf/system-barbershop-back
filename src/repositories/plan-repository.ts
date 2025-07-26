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

export type PlanWithRecurrence = Plan & {
  typeRecurrence: { period: number }
}

export type PlanWithBenefitsAndRecurrence = PlanWithBenefits &
  PlanWithRecurrence

export interface PlanRepository {
  findById(id: string): Promise<Plan | null>
  findByIdWithBenefits(id: string): Promise<PlanWithBenefits | null>
  findByIdWithBenefitsAndRecurrence(
    id: string,
  ): Promise<PlanWithBenefitsAndRecurrence | null>
  findByIdWithRecurrence(id: string): Promise<PlanWithRecurrence | null>
  create(data: Prisma.PlanCreateInput): Promise<Plan>
  update(id: string, data: Prisma.PlanUpdateInput): Promise<Plan>
  findMany(where?: Prisma.PlanWhereInput): Promise<PlanWithBenefits[]>
  delete(id: string): Promise<void>
}
