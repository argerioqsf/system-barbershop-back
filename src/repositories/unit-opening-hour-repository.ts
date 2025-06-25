import { Prisma, UnitOpeningHour } from '@prisma/client'

export interface UnitOpeningHourRepository {
  create(
    data: Prisma.UnitOpeningHourUncheckedCreateInput,
  ): Promise<UnitOpeningHour>
  findManyByUnit(unitId: string, weekDay?: number): Promise<UnitOpeningHour[]>
  delete(id: string): Promise<void>
}
