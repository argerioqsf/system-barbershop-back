import { Plan, Prisma } from '@prisma/client'
import { PlanRepository } from '../plan-repository'
import { randomUUID } from 'crypto'

export class InMemoryPlanRepository implements PlanRepository {
  constructor(public plans: Plan[] = []) {}

  async findById(id: string) {
    return this.plans.find((p) => p.id === id) ?? null
  }

  async create(data: Prisma.PlanCreateInput) {
    const plan: Plan = {
      id: randomUUID(),
      price: data.price as number,
      name: data.name as string,
      typeRecurrenceId: (data.typeRecurrence as { connect: { id: string } })
        .connect!.id,
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
}
