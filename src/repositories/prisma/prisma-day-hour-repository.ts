import { prisma } from '@/lib/prisma'
import { Prisma, DayHour } from '@prisma/client'
import { DayHourRepository } from '../day-hour-repository'

export class PrismaDayHourRepository implements DayHourRepository {
  async create(data: Prisma.DayHourCreateInput): Promise<DayHour> {
    return prisma.dayHour.create({ data })
  }

  async findMany(where: Prisma.DayHourWhereInput = {}): Promise<DayHour[]> {
    return prisma.dayHour.findMany({ where })
  }
}
