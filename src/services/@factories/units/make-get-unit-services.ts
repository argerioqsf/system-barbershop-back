import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { GetUnitService } from '@/services/units/get-unit-service'

export function makeGetUnitService() {
  return new GetUnitService(new PrismaUnitRepository())
}
