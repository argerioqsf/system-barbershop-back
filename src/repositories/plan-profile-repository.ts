import { PlanProfile, Prisma, Debt } from '@prisma/client'

export type PlanProfileWithDebts = PlanProfile & { debts: Debt[] }

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
  findById(id: string): Promise<PlanProfileWithDebts | null>
  findByDebtId(id: string): Promise<PlanProfileWithDebts | null>
}
