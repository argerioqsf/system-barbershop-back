import { Plan, Prisma } from '@prisma/client'
import {
  PlanRepository,
  PlanWithBenefits,
  PlanWithBenefitsAndRecurrence,
} from '../plan-repository'
import { randomUUID } from 'crypto'

export class InMemoryPlanRepository implements PlanRepository {
  constructor(public plans: (PlanWithBenefits | Plan)[] = []) {}

  async findById(id: string) {
    return this.plans.find((p) => p.id === id) ?? null
  }

  async findByIdWithBenefits(id: string): Promise<PlanWithBenefits | null> {
    const plan = this.plans.find((p) => p.id === id)
    if (!plan) return null
    return plan as PlanWithBenefits
  }

  async findByIdWithBenefitsAndRecurrence(
    id: string,
  ): Promise<PlanWithBenefitsAndRecurrence | null> {
    const plan = await this.findByIdWithBenefits(id)
    if (!plan) return null
    return { ...(plan as PlanWithBenefits), typeRecurrence: { period: 1 } }
  }

  async findByIdWithRecurrence(
    id: string,
  ): Promise<(Plan & { typeRecurrence: { period: number } }) | null> {
    const plan = this.plans.find((p) => p.id === id) as
      | (Plan & { typeRecurrence?: { period: number } })
      | undefined
    if (!plan) return null
    return {
      ...plan,
      typeRecurrence: plan.typeRecurrence ?? { period: 1 },
    }
  }

  async create(data: Prisma.PlanCreateInput) {
    const plan: Plan = {
      id: randomUUID(),
      price: data.price as number,
      name: data.name as string,
      typeRecurrenceId: (
        data.typeRecurrence as { connect?: { id: string } } | undefined
      )?.connect?.id as string,
    }
    this.plans.push(plan)
    return plan
  }

  async update(id: string, data: Prisma.PlanUpdateInput) {
    const plan = await this.findById(id)
    if (!plan) throw new Error('Plan not found')
    if (data.price) plan.price = data.price as number
    if (data.name) plan.name = data.name as string
    if (data.typeRecurrence && 'connect' in data.typeRecurrence) {
      plan.typeRecurrenceId = (
        data.typeRecurrence as { connect: { id: string } }
      ).connect.id
    }
    return plan
  }

  async findMany() {
    return this.plans
  }

  async delete(id: string): Promise<void> {
    this.plans = this.plans.filter((p) => p.id !== id)
  }
}
