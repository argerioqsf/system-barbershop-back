import { PlanProfile, Prisma, Debt } from '@prisma/client'
import { PlanWithRecurrence } from './plan-repository'

export type PlanProfileWithDebts = PlanProfile & { debts: Debt[] }
export type PlanProfileWithPlan = PlanProfile & { plan: PlanWithRecurrence }
export type PlanProfileFindById = PlanProfileWithDebts & PlanProfileWithPlan
export interface PlanProfileRepository {
  create(
    data: Prisma.PlanProfileUncheckedCreateInput & {
      debts?: Prisma.DebtUncheckedCreateWithoutPlanProfileInput[]
    },
    tx?: Prisma.TransactionClient,
  ): Promise<PlanProfileWithDebts>
  findMany(
    where?: Prisma.PlanProfileWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PlanProfileWithDebts[]>
  update(
    id: string,
    data: Prisma.PlanProfileUncheckedUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PlanProfile>
  findById(id: string): Promise<PlanProfileFindById | null>
  findByDebtId(id: string): Promise<PlanProfileWithDebts | null>
}
