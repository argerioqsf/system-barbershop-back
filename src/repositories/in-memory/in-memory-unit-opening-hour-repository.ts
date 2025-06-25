import { Prisma, UnitOpeningHour } from '@prisma/client'
import { UnitOpeningHourRepository } from '../unit-opening-hour-repository'
import { randomUUID } from 'crypto'

export class InMemoryUnitOpeningHourRepository
  implements UnitOpeningHourRepository
{
  constructor(public items: UnitOpeningHour[] = []) {}

  async create(
    data: Prisma.UnitOpeningHourUncheckedCreateInput,
  ): Promise<UnitOpeningHour> {
    const item: UnitOpeningHour = {
      id: randomUUID(),
      unitId: data.unitId,
      weekDay: data.weekDay,
      startHour: data.startHour,
      endHour: data.endHour,
    }
    this.items.push(item)
    return item
  }

  async findManyByUnit(unitId: string): Promise<UnitOpeningHour[]> {
    return this.items.filter((i) => i.unitId === unitId)
  }
}
