import { prisma } from '@/lib/prisma'
import { Prisma, UnitDayHour } from '@prisma/client'
import { UnitDayHourRepository } from '../unit-day-hour-repository'

export class PrismaUnitDayHourRepository implements UnitDayHourRepository {
  async create(
    data: Prisma.UnitDayHourUncheckedCreateInput,
  ): Promise<UnitDayHour> {
    return prisma.unitDayHour.create({ data })
  }

  async findManyByUnit(unitId: string): Promise<UnitDayHour[]> {
    return prisma.unitDayHour.findMany({ where: { unitId } })
  }
}
