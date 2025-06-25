import { PrismaUnitOpeningHourRepository } from '@/repositories/prisma/prisma-unit-opening-hour-repository'
import { AddUnitOpeningHourService } from '@/services/unit/add-unit-opening-hour'

export function makeAddUnitOpeningHourService() {
  return new AddUnitOpeningHourService(new PrismaUnitOpeningHourRepository())
}
