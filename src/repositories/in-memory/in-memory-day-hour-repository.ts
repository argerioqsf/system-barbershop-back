import { Prisma, DayHour } from '@prisma/client'
import { DayHourRepository } from '../day-hour-repository'
import { randomUUID } from 'crypto'

export class InMemoryDayHourRepository implements DayHourRepository {
  constructor(public items: DayHour[] = []) {}

  async create(data: Prisma.DayHourCreateInput): Promise<DayHour> {
    const dayHour: DayHour = {
      id: randomUUID(),
      weekDay: data.weekDay as number,
      startHour: data.startHour as string,
      endHour: data.endHour as string,
    }
    this.items.push(dayHour)
    return dayHour
  }

  async findMany(where: Prisma.DayHourWhereInput = {}): Promise<DayHour[]> {
    return this.items.filter((dh) => {
      if (where.weekDay && dh.weekDay !== where.weekDay) return false
      if (where.id) {
        if (typeof where.id === 'object' && 'in' in where.id) {
          if (!where.id.in?.includes(dh.id)) return false
        } else if (where.id !== dh.id) {
          return false
        }
      }
      return true
    })
  }
}
