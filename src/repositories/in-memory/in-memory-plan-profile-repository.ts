import { PlanProfileStatus, PaymentStatus, Prisma } from '@prisma/client'
import {
  PlanProfileRepository,
  PlanProfileWithDebts,
} from '../plan-profile-repository'
import { randomUUID } from 'crypto'

export class InMemoryPlanProfileRepository implements PlanProfileRepository {
  constructor(public items: PlanProfileWithDebts[] = []) {}

  async create(
    data: Prisma.PlanProfileUncheckedCreateInput & {
      debts?: Prisma.DebtUncheckedCreateWithoutPlanProfileInput[]
    },
  ): Promise<PlanProfileWithDebts> {
    const planProfile: PlanProfileWithDebts = {
      id: randomUUID(),
      planStartDate: data.planStartDate as Date,
      status: (data.status as PlanProfileStatus) ?? PlanProfileStatus.PAID,
      saleItemId: data.saleItemId,
      dueDateDebt: data.dueDateDebt,
      planId: data.planId,
      profileId: data.profileId,
      debts: [],
    }

    planProfile.debts = (data.debts ?? []).map((d) => ({
      id: randomUUID(),
      value: d.value as number,
      status: (d.status as PaymentStatus) ?? PaymentStatus.PAID,
      planId: planProfile.planId,
      planProfileId: planProfile.id,
      paymentDate: d.paymentDate as Date,
      createdAt: (d.createdAt as Date) ?? new Date(),
    }))

    this.items.push(planProfile)
    return planProfile
  }

  async findMany(
    where: Prisma.PlanProfileWhereInput = {},
  ): Promise<PlanProfileWithDebts[]> {
    if (!where || Object.keys(where).length === 0) return this.items
    return this.items.filter((p) => {
      if (where.saleItemId && p.saleItemId !== where.saleItemId) return false
      if (where.planId && p.planId !== where.planId) return false
      if (where.profileId && p.profileId !== where.profileId) return false
      return true
    })
  }

  async findById(id: string): Promise<PlanProfileWithDebts | null> {
    return this.items.find((p) => p.id === id) ?? null
  }

  async findByDebtId(id: string): Promise<PlanProfileWithDebts | null> {
    return this.items.find((p) => p.debts.some((d) => d.id === id)) ?? null
  }
}
