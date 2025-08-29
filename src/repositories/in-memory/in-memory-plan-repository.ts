import { Plan, Prisma, DiscountType } from '@prisma/client'
import {
  PlanRepository,
  PlanWithBenefits,
  PlanWithBenefitsAndRecurrence,
  PlanWithRecurrence,
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
    return {
      ...(plan as PlanWithBenefits),
      typeRecurrence: { id: 'rec-default', period: 1 },
    }
  }

  async findByIdWithRecurrence(id: string): Promise<PlanWithRecurrence | null> {
    const plan = this.plans.find((p) => p.id === id) as
      | (Plan & { typeRecurrence?: { id: string; period: number } })
      | undefined
    if (!plan) return null
    return {
      ...plan,
      typeRecurrence: plan.typeRecurrence ?? { id: 'rec-default', period: 1 },
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
    const benefits = (
      (
        data as Prisma.PlanCreateInput & {
          benefits?: { create: { benefit: { connect: { id: string } } }[] }
        }
      ).benefits?.create ?? []
    ).map((b) => ({
      id: randomUUID(),
      planId: plan.id,
      benefitId: b.benefit.connect.id,
      benefit: {
        id: b.benefit.connect.id,
        name: '',
        description: null,
        discount: 0,
        discountType: DiscountType.VALUE,
        unitId: '',
        categories: [],
        services: [],
        products: [],
      },
    }))
    this.plans.push({ ...(plan as Plan), benefits } as PlanWithBenefits)
    return plan
  }

  async update(
    id: string,
    data: Prisma.PlanUpdateInput,
    _tx?: Prisma.TransactionClient, // eslint-disable-line @typescript-eslint/no-unused-vars
  ) {
    const plan = await this.findById(id)
    if (!plan) throw new Error('Plan not found')
    if (data.price) plan.price = data.price as number
    if (data.name) plan.name = data.name as string
    if (data.typeRecurrence && 'connect' in data.typeRecurrence) {
      plan.typeRecurrenceId = (
        data.typeRecurrence as { connect: { id: string } }
      ).connect.id
    }
    if (data.benefits) {
      ;(plan as PlanWithBenefits).benefits = (
        (
          data as Prisma.PlanUpdateInput & {
            benefits?: { create?: { benefit: { connect: { id: string } } }[] }
          }
        ).benefits?.create ?? []
      ).map((b) => ({
        id: randomUUID(),
        planId: plan.id,
        benefitId: b.benefit.connect.id,
        benefit: {
          id: b.benefit.connect.id,
          name: '',
          description: null,
          discount: 0,
          discountType: DiscountType.VALUE,
          unitId: '',
          categories: [],
          services: [],
          products: [],
        },
      }))
    }
    return plan
  }

  async findMany(
    _where: Prisma.PlanWhereInput = {}, // eslint-disable-line @typescript-eslint/no-unused-vars
    _tx?: Prisma.TransactionClient, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<PlanWithBenefits[]> {
    return this.plans as PlanWithBenefits[]
  }

  async delete(id: string): Promise<void> {
    this.plans = this.plans.filter((p) => p.id !== id)
  }
}
