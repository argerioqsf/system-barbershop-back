import {
  Plan,
  Prisma,
  DiscountType,
  BenefitPlan,
  Benefit,
  BenefitCategory,
  BenefitService,
  BenefitProduct,
  TypeRecurrence,
} from '@prisma/client'
import {
  PlanRepository,
  PlanWithBenefits,
  PlanWithBenefitsAndRecurrence,
  PlanWithRecurrence,
} from '../plan-repository'
import { randomUUID } from 'crypto'

type StoredPlan = PlanWithBenefits & { typeRecurrence?: TypeRecurrence }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toNumber(value: unknown, fallback: number): number {
  if (value === undefined || value === null) return fallback
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  if (isObject(value) && 'toNumber' in value) {
    const candidate = value as { toNumber?: () => number }
    if (typeof candidate.toNumber === 'function') {
      return candidate.toNumber()
    }
  }
  const coerced = Number(value)
  return Number.isNaN(coerced) ? fallback : coerced
}

export class InMemoryPlanRepository implements PlanRepository {
  constructor(public plans: StoredPlan[] = []) {
    this.plans = plans.map((plan) => this.normalizePlan(plan))
  }

  private createTypeRecurrence(): TypeRecurrence {
    return {
      id: 'rec-default',
      period: 1,
    }
  }

  private createBenefitStub(
    unitId: string,
    benefitId: string,
  ): Benefit & {
    categories: BenefitCategory[]
    services: BenefitService[]
    products: BenefitProduct[]
  } {
    const baseBenefit: Benefit = {
      id: benefitId,
      name: '',
      description: null,
      discount: 0,
      discountType: DiscountType.VALUE,
      unitId,
    }

    return {
      ...baseBenefit,
      categories: [],
      services: [],
      products: [],
    }
  }

  private createBenefitLink(
    planId: string,
    unitId: string,
    benefitId: string,
  ): PlanWithBenefits['benefits'][number] {
    return {
      id: randomUUID(),
      planId,
      benefitId,
      benefit: this.createBenefitStub(unitId, benefitId),
    }
  }

  private normalizeBenefits(
    unitId: string,
    benefits: Array<
      BenefitPlan & {
        benefit?: Benefit & {
          categories?: BenefitCategory[]
          services?: BenefitService[]
          products?: BenefitProduct[]
        }
      }
    >,
  ): PlanWithBenefits['benefits'] {
    return benefits.map((benefitLink) => {
      const existing = benefitLink.benefit
      const normalizedBenefit = existing
        ? {
            ...existing,
            categories: existing.categories ?? [],
            services: existing.services ?? [],
            products: existing.products ?? [],
          }
        : this.createBenefitStub(unitId, benefitLink.benefitId)

      return {
        id: benefitLink.id,
        planId: benefitLink.planId,
        benefitId: benefitLink.benefitId,
        benefit: normalizedBenefit,
      }
    })
  }

  private normalizePlan(plan: Plan | PlanWithBenefits): StoredPlan {
    const basePlan: Plan = {
      id: plan.id,
      name: plan.name,
      price: toNumber(plan.price, 0),
      typeRecurrenceId: plan.typeRecurrenceId,
      unitId: plan.unitId ?? 'unit-1',
    }

    const normalizedBenefits = this.normalizeBenefits(
      basePlan.unitId,
      ((plan as PlanWithBenefits).benefits ?? []) as Array<
        BenefitPlan & {
          benefit?: Benefit & {
            categories?: BenefitCategory[]
            services?: BenefitService[]
            products?: BenefitProduct[]
          }
        }
      >,
    )

    const storedPlan: StoredPlan = {
      ...basePlan,
      benefits: normalizedBenefits,
    }

    if ('typeRecurrence' in (plan as any) && (plan as any).typeRecurrence) {
      storedPlan.typeRecurrence = this.createTypeRecurrenceFrom(
        (plan as any).typeRecurrence,
      )
    }

    return storedPlan
  }

  private createTypeRecurrenceFrom(
    typeRecurrence: TypeRecurrence,
  ): TypeRecurrence {
    return {
      id: typeRecurrence.id,
      period: typeRecurrence.period,
    }
  }

  private cloneBenefits(
    benefits: PlanWithBenefits['benefits'],
  ): PlanWithBenefits['benefits'] {
    return benefits.map((benefit) => ({
      id: benefit.id,
      planId: benefit.planId,
      benefitId: benefit.benefitId,
      benefit: {
        ...benefit.benefit,
        categories: [...benefit.benefit.categories],
        services: [...benefit.benefit.services],
        products: [...benefit.benefit.products],
      },
    }))
  }

  private cloneStoredPlan(plan: StoredPlan): StoredPlan {
    const basePlan: Plan = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      typeRecurrenceId: plan.typeRecurrenceId,
      unitId: plan.unitId,
    }

    const cloned: StoredPlan = {
      ...basePlan,
      benefits: this.cloneBenefits(plan.benefits),
    }

    if (plan.typeRecurrence) {
      cloned.typeRecurrence = this.createTypeRecurrenceFrom(plan.typeRecurrence)
    }

    return cloned
  }

  private extractConnectedId(
    relation: { connect?: { id: string } | null } | undefined,
  ): string | null {
    if (!relation || !relation.connect) return null
    return relation.connect.id
  }

  private applyBenefitUpdates(
    plan: StoredPlan,
    input: Prisma.BenefitPlanUpdateManyWithoutPlanNestedInput,
  ): PlanWithBenefits['benefits'] {
    let benefits = [...plan.benefits]

    if (input.deleteMany) {
      const deletions = Array.isArray(input.deleteMany)
        ? input.deleteMany
        : [input.deleteMany]
      const idsToDelete = deletions
        .map((condition) => {
          if (isObject(condition) && 'benefitId' in condition) {
            return condition.benefitId as string | undefined
          }
          if (isObject(condition) && 'id' in condition) {
            return condition.id as string | undefined
          }
          return undefined
        })
        .filter((value): value is string => typeof value === 'string')

      if (idsToDelete.length > 0) {
        benefits = benefits.filter(
          (benefit) => !idsToDelete.includes(benefit.benefitId),
        )
      } else if (deletions.length > 0) {
        benefits = []
      }
    }

    if (input.set) {
      const setEntries = Array.isArray(input.set) ? input.set : [input.set]
      benefits = setEntries
        .map((entry) => {
          if (isObject(entry)) {
            if ('benefitId' in entry && entry.benefitId) {
              return this.createBenefitLink(
                plan.id,
                plan.unitId,
                entry.benefitId as string,
              )
            }
            if ('id' in entry && entry.id) {
              return this.createBenefitLink(
                plan.id,
                plan.unitId,
                entry.id as string,
              )
            }
          }
          return null
        })
        .filter(
          (benefit): benefit is PlanWithBenefits['benefits'][number] =>
            benefit !== null,
        )
    }

    if (input.create) {
      const creations = Array.isArray(input.create)
        ? input.create
        : [input.create]
      const createdBenefits = creations
        .map((creation) => {
          const benefitId =
            (creation as any).benefit?.connect?.id ||
            (creation as any).benefitId
          if (!benefitId) return null
          return this.createBenefitLink(plan.id, plan.unitId, benefitId)
        })
        .filter(
          (benefit): benefit is PlanWithBenefits['benefits'][number] =>
            benefit !== null,
        )
      benefits = benefits.concat(createdBenefits)
    }

    return benefits
  }

  private matchesWhere(
    plan: StoredPlan,
    where: Prisma.PlanWhereInput,
  ): boolean {
    if (where.unitId) {
      const unitFilter = where.unitId
      if (typeof unitFilter === 'string') {
        if (plan.unitId !== unitFilter) return false
      } else if (isObject(unitFilter)) {
        if (
          'equals' in unitFilter &&
          unitFilter.equals !== undefined &&
          plan.unitId !== unitFilter.equals
        ) {
          return false
        }
        if (
          'in' in unitFilter &&
          Array.isArray(unitFilter.in) &&
          !unitFilter.in.includes(plan.unitId)
        ) {
          return false
        }
      }
    }

    if (where.benefits && 'some' in where.benefits && where.benefits.some) {
      const some = where.benefits.some
      if (
        isObject(some) &&
        'benefitId' in some &&
        some.benefitId !== undefined
      ) {
        const benefitFilter = some.benefitId
        if (typeof benefitFilter === 'string') {
          if (
            !plan.benefits.some(
              (benefit) => benefit.benefitId === benefitFilter,
            )
          ) {
            return false
          }
        } else if (isObject(benefitFilter) && 'equals' in benefitFilter) {
          const equals = (benefitFilter as { equals?: string }).equals
          if (
            equals !== undefined &&
            !plan.benefits.some((benefit) => benefit.benefitId === equals)
          ) {
            return false
          }
        }
      }
    }

    return true
  }

  async findById(id: string): Promise<Plan | null> {
    const plan = this.plans.find((storedPlan) => storedPlan.id === id)
    if (!plan) return null

    const cloned = this.cloneStoredPlan(plan)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { typeRecurrence: _ignored, ...rest } = cloned
    return rest
  }

  async findByIdWithBenefits(id: string): Promise<PlanWithBenefits | null> {
    const plan = this.plans.find((storedPlan) => storedPlan.id === id)
    if (!plan) return null

    const cloned = this.cloneStoredPlan(plan)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { typeRecurrence: _ignored, ...rest } = cloned
    return rest
  }

  async findByIdWithBenefitsAndRecurrence(
    id: string,
  ): Promise<PlanWithBenefitsAndRecurrence | null> {
    const plan = this.plans.find((storedPlan) => storedPlan.id === id)
    if (!plan) return null

    const cloned = this.cloneStoredPlan(plan)
    return {
      ...cloned,
      typeRecurrence: cloned.typeRecurrence ?? this.createTypeRecurrence(),
    }
  }

  async findByIdWithRecurrence(id: string): Promise<PlanWithRecurrence | null> {
    const plan = this.plans.find((storedPlan) => storedPlan.id === id)
    if (!plan) return null

    const cloned = this.cloneStoredPlan(plan)
    return {
      ...cloned,
      typeRecurrence: cloned.typeRecurrence ?? this.createTypeRecurrence(),
    }
  }

  async create(
    data: Prisma.PlanCreateInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tx?: Prisma.TransactionClient,
  ): Promise<Plan> {
    const unitId = this.extractConnectedId(
      data.unit as { connect?: { id: string } } | undefined,
    )
    if (!unitId) {
      throw new Error('unitId is required to create a plan')
    }

    const typeRecurrenceId = this.extractConnectedId(
      data.typeRecurrence as { connect?: { id: string } } | undefined,
    )
    if (!typeRecurrenceId) {
      throw new Error('typeRecurrenceId is required to create a plan')
    }

    const plan: Plan = {
      id: (data as { id?: string }).id ?? randomUUID(),
      name: data.name as string,
      price: toNumber(data.price, 0),
      typeRecurrenceId,
      unitId,
    }

    const benefitsInput =
      (
        data as {
          benefits?: {
            create?:
              | Array<{ benefit: { connect: { id: string } } }>
              | { benefit: { connect: { id: string } } }
          }
        }
      ).benefits?.create ?? []

    const benefitCreations = Array.isArray(benefitsInput)
      ? benefitsInput
      : [benefitsInput]

    const storedPlan: StoredPlan = {
      ...plan,
      benefits: benefitCreations
        .map((creation) => {
          const benefitId = this.extractConnectedId(
            creation.benefit as { connect?: { id: string } } | undefined,
          )
          if (!benefitId) return null
          return this.createBenefitLink(plan.id, unitId, benefitId)
        })
        .filter(
          (benefit): benefit is PlanWithBenefits['benefits'][number] =>
            benefit !== null,
        ),
    }

    this.plans.push(storedPlan)
    return plan
  }

  async update(
    id: string,
    data: Prisma.PlanUpdateInput,
    _tx?: Prisma.TransactionClient, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<Plan> {
    const index = this.plans.findIndex((plan) => plan.id === id)
    if (index < 0) throw new Error('Plan not found')

    const plan = this.plans[index]

    if (data.price !== undefined) {
      plan.price = toNumber(data.price, plan.price)
    }

    if (data.name !== undefined) {
      plan.name = data.name as string
    }

    if (data.typeRecurrence && 'connect' in data.typeRecurrence) {
      const newTypeRecurrenceId = data.typeRecurrence.connect?.id
      if (newTypeRecurrenceId) {
        plan.typeRecurrenceId = newTypeRecurrenceId
        plan.typeRecurrence = this.createTypeRecurrence()
      }
    }

    if (data.unit && 'connect' in data.unit) {
      const newUnitId = data.unit.connect?.id
      if (newUnitId) {
        plan.unitId = newUnitId
      }
    }

    if (data.benefits) {
      plan.benefits = this.applyBenefitUpdates(plan, data.benefits)
    }

    this.plans[index] = plan
    return plan
  }

  async findMany(
    where: Prisma.PlanWhereInput = {},
    _tx?: Prisma.TransactionClient, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<PlanWithBenefits[]> {
    return this.plans
      .filter((plan) => this.matchesWhere(plan, where))
      .map((plan) => {
        const cloned = this.cloneStoredPlan(plan)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { typeRecurrence: _ignored, ...rest } = cloned
        return rest
      })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(id: string, _tx?: Prisma.TransactionClient): Promise<void> {
    this.plans = this.plans.filter((plan) => plan.id !== id)
  }
}
