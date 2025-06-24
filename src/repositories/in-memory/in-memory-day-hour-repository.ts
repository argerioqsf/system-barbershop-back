import { Prisma, DayHour } from '@prisma/client'
import { DayHourRepository } from '../day-hour-repository'
import { randomUUID } from 'crypto'

export class InMemoryDayHourRepository implements DayHourRepository {
  constructor(public items: DayHour[] = []) {}

  async create(data: Prisma.DayHourCreateInput): Promise<DayHour> {
    const dayHour: DayHour = {
      id: randomUUID(),
      weekDay: data.weekDay as number,
      startHour: data.startHour as Date,
      endHour: data.endHour as Date,
    }
    this.items.push(dayHour)
    return dayHour
  }

  async findMany(where: Prisma.DayHourWhereInput = {}): Promise<DayHour[]> {
    return this.items.filter((dh) => {
      if (where.weekDay && dh.weekDay !== where.weekDay) return false
      return true
    })
  }
}
