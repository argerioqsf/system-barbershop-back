import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { GetUnitService } from '@/services/unit/get-unit'

export function makeGetUnitService() {
  return new GetUnitService(new PrismaUnitRepository())
}
