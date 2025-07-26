import { Prisma, TypeRecurrence } from '@prisma/client'
import { randomUUID } from 'crypto'
import { TypeRecurrenceRepository } from '../type-recurrence-repository'

export class InMemoryTypeRecurrenceRepository
  implements TypeRecurrenceRepository
{
  constructor(public items: TypeRecurrence[] = []) {}

  async create(
    data: Prisma.TypeRecurrenceCreateInput,
  ): Promise<TypeRecurrence> {
    const item: TypeRecurrence = {
      id: randomUUID(),
      period: data.period,
    }
    this.items.push(item)
    return item
  }

  async update(
    id: string,
    data: Prisma.TypeRecurrenceUpdateInput,
  ): Promise<TypeRecurrence> {
    const item = this.items.find((i) => i.id === id)
    if (!item) throw new Error('TypeRecurrence not found')
    if (data.period) item.period = data.period as number
    return item
  }

  async findById(id: string): Promise<TypeRecurrence | null> {
    return this.items.find((i) => i.id === id) ?? null
  }

  async findMany(
    where: Prisma.TypeRecurrenceWhereInput = {},
  ): Promise<TypeRecurrence[]> {
    return this.items.filter((i) => {
      if (where.period && i.period !== where.period) return false
      return true
    })
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((i) => i.id !== id)
  }
}
