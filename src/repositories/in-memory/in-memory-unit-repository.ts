import { Prisma, Unit } from '@prisma/client'
import { UnitRepository } from '../unit-repository'

export class InMemoryUnitRepository implements UnitRepository {
  constructor(
    public unit: Unit,
    public units: Unit[] = [unit],
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(_data: Prisma.UnitCreateInput): Promise<Unit> {
    throw new Error('not implemented')
  }

  async findById(id: string): Promise<Unit | null> {
    return this.units.find((u) => u.id === id) ?? null
  }

  async findManyByOrganization(organizationId: string): Promise<Unit[]> {
    return this.units.filter((u) => u.organizationId === organizationId)
  }

  async findMany(): Promise<Unit[]> {
    return this.units
  }

  async update(id: string, data: Prisma.UnitUpdateInput): Promise<Unit> {
    const unit = this.units.find((u) => u.id === id)
    if (!unit) throw new Error('Unit not found')
    Object.assign(unit, data as Partial<Unit>)
    return unit
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delete(_id: string): Promise<void> {
    throw new Error('not implemented')
  }

  async incrementBalance(id: string, amount: number): Promise<void> {
    const unit = this.units.find((u) => u.id === id)
    if (unit) {
      unit.totalBalance += amount
    }
  }
}
