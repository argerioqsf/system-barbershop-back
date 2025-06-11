import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { ListUnitsService } from '@/services/unit/list-units'

export function makeListUnitsService() {
  return new ListUnitsService(new PrismaUnitRepository())
}
