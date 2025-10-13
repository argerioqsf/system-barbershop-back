import {
  Plan,
  PlanProfileStatus,
  PaymentStatus,
  Prisma,
  PlanProfile,
  TypeRecurrence,
} from '@prisma/client'
import {
  PlanProfileRepository,
  PlanProfileWithDebts,
  PlanProfileFindById,
} from '../plan-profile-repository'
import { PlanWithRecurrence } from '../plan-repository'
import { randomUUID } from 'crypto'

export class InMemoryPlanProfileRepository implements PlanProfileRepository {
  constructor(
    public items: (PlanProfileWithDebts & { plan?: PlanWithRecurrence })[] = [],
  ) {
    this.items = items.map((item) => ({
      ...item,
      plan: this.ensurePlan(item.planId, item.plan),
    }))
  }

  private createTypeRecurrence(): TypeRecurrence {
    return {
      id: 'rec-default',
      period: 1,
    }
  }

  private createPlan(planId: string): PlanWithRecurrence {
    const basePlan: Plan = {
      id: planId,
      name: '',
      price: 0,
      typeRecurrenceId: '',
      unitId: 'unit-1',
    }

    return {
      ...basePlan,
      typeRecurrence: this.createTypeRecurrence(),
    }
  }

  private ensurePlan(
    planId: string,
    plan?: PlanWithRecurrence,
  ): PlanWithRecurrence {
    if (!plan) return this.createPlan(planId)
    return {
      ...plan,
      typeRecurrence: plan.typeRecurrence ?? this.createTypeRecurrence(),
    }
  }

  async create(
    data: Prisma.PlanProfileUncheckedCreateInput & {
      debts?: Prisma.DebtUncheckedCreateWithoutPlanProfileInput[]
    },
  ): Promise<PlanProfileWithDebts> {
    const planProfile: PlanProfileWithDebts & { plan: PlanWithRecurrence } = {
      id: randomUUID(),
      planStartDate: data.planStartDate as Date,
      status: (data.status as PlanProfileStatus) ?? PlanProfileStatus.PAID,
      saleItemId: data.saleItemId,
      dueDayDebt: data.dueDayDebt,
      planId: data.planId,
      profileId: data.profileId,
      debts: [],
      plan: this.createPlan(data.planId),
    }

    planProfile.debts = (data.debts ?? []).map((d) => ({
      id: randomUUID(),
      value: d.value as number,
      status: (d.status as PaymentStatus) ?? PaymentStatus.PAID,
      planId: planProfile.planId,
      planProfileId: planProfile.id,
      paymentDate: (d.paymentDate as Date | null | undefined) ?? null,
      dueDate: d.dueDate as Date,
      createdAt: (d.createdAt as Date) ?? new Date(),
    }))

    this.items.push(planProfile)
    return planProfile
  }

  async findMany(
    where: Prisma.PlanProfileWhereInput = {},
    _tx?: Prisma.TransactionClient, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<PlanProfileWithDebts[]> {
    if (!where || Object.keys(where).length === 0) return this.items
    return this.items.filter((p) => {
      if (where.saleItemId && p.saleItemId !== where.saleItemId) return false
      if (where.planId && p.planId !== where.planId) return false
      if (where.profileId && p.profileId !== where.profileId) return false
      return true
    })
  }

  async findById(id: string): Promise<PlanProfileFindById | null> {
    const item = this.items.find((p) => p.id === id)
    if (!item) return null

    const planProfile: PlanProfileFindById = {
      ...item,
      plan: this.ensurePlan(item.planId, item.plan),
    }

    return planProfile
  }

  async findByDebtId(id: string): Promise<PlanProfileWithDebts | null> {
    return this.items.find((p) => p.debts.some((d) => d.id === id)) ?? null
  }

  async update(
    id: string,
    data: Prisma.PlanProfileUncheckedUpdateInput,
    _tx?: Prisma.TransactionClient, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<PlanProfile> {
    const idx = this.items.findIndex((p) => p.id === id)
    if (idx < 0) throw new Error('PlanProfile not found')
    const current = this.items[idx]
    const updated: PlanProfileWithDebts & { plan?: PlanWithRecurrence } = {
      ...current,
      planStartDate: (data.planStartDate ?? current.planStartDate) as Date,
      status: (data.status ?? current.status) as PlanProfileStatus,
      saleItemId: (data.saleItemId ?? current.saleItemId) as string,
      dueDayDebt: (data.dueDayDebt ?? current.dueDayDebt) as number,
      planId: (data.planId ?? current.planId) as string,
      profileId: (data.profileId ?? current.profileId) as string,
      plan: this.ensurePlan(
        (data.planId ?? current.planId) as string,
        current.plan,
      ),
    }
    this.items[idx] = updated
    return {
      id: updated.id,
      planStartDate: updated.planStartDate,
      status: updated.status,
      saleItemId: updated.saleItemId,
      dueDayDebt: updated.dueDayDebt,
      planId: updated.planId,
      profileId: updated.profileId,
    }
  }
}
