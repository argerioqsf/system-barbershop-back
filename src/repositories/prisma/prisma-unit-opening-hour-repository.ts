import { prisma } from '@/lib/prisma'
import { Prisma, UnitOpeningHour } from '@prisma/client'
import { UnitOpeningHourRepository } from '../unit-opening-hour-repository'

export class PrismaUnitOpeningHourRepository
  implements UnitOpeningHourRepository
{
  async create(
    data: Prisma.UnitOpeningHourUncheckedCreateInput,
  ): Promise<UnitOpeningHour> {
    return prisma.unitOpeningHour.create({ data })
  }

  async findManyByUnit(
    unitId: string,
    weekDay?: number,
  ): Promise<UnitOpeningHour[]> {
    return prisma.unitOpeningHour.findMany({
      where: { unitId, ...(weekDay ? { weekDay } : {}) },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.unitOpeningHour.delete({ where: { id } })
  }
}
