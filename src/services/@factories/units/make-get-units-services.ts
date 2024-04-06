import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { GetUnitsService } from '@/services/units/get-units-service'

export function makeGetUnitsService() {
  return new GetUnitsService(new PrismaUnitRepository())
}
