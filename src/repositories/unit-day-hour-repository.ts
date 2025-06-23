import { Prisma, UnitDayHour } from '@prisma/client'

export interface UnitDayHourRepository {
  create(data: Prisma.UnitDayHourUncheckedCreateInput): Promise<UnitDayHour>
  findManyByUnit(unitId: string): Promise<UnitDayHour[]>
}
