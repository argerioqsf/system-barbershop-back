import { PrismaUnitOpeningHourRepository } from '@/repositories/prisma/prisma-unit-opening-hour-repository'
import { ListUnitOpeningHoursService } from '@/services/unit/list-unit-opening-hours'

export function makeListUnitOpeningHoursService() {
  return new ListUnitOpeningHoursService(new PrismaUnitOpeningHourRepository())
}
