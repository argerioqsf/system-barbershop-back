import {
  Plan,
  Prisma,
  Benefit,
  BenefitPlan,
  BenefitCategory,
  BenefitService,
  BenefitProduct,
  TypeRecurrence,
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
  typeRecurrence: TypeRecurrence
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
  update(
    id: string,
    data: Prisma.PlanUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Plan>
  findMany(
    where?: Prisma.PlanWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PlanWithBenefits[]>
  delete(id: string): Promise<void>
}
