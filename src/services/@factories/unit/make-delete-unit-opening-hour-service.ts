import { PrismaUnitOpeningHourRepository } from '@/repositories/prisma/prisma-unit-opening-hour-repository'
import { DeleteUnitOpeningHourService } from '@/services/unit/delete-unit-opening-hour'

export function makeDeleteUnitOpeningHourService() {
  return new DeleteUnitOpeningHourService(new PrismaUnitOpeningHourRepository())
}
