import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { SearchUnitService } from '@/services/units/search-units-service'

export function makeSearchUnitsService() {
  return new SearchUnitService(new PrismaUnitRepository())
}
