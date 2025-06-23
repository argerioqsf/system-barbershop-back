import { Prisma, UnitDayHour } from '@prisma/client'
import { UnitDayHourRepository } from '../unit-day-hour-repository'
import { randomUUID } from 'crypto'

export class InMemoryUnitDayHourRepository implements UnitDayHourRepository {
  constructor(public items: UnitDayHour[] = []) {}

  async create(
    data: Prisma.UnitDayHourUncheckedCreateInput,
  ): Promise<UnitDayHour> {
    const item: UnitDayHour = {
      id: randomUUID(),
      unitId: data.unitId,
      dayHourId: data.dayHourId,
    }
    this.items.push(item)
    return item
  }

  async findManyByUnit(unitId: string): Promise<UnitDayHour[]> {
    return this.items.filter((i) => i.unitId === unitId)
  }
}
