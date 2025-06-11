import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { UpdateUnitService } from '@/services/unit/update-unit'

export function makeUpdateUnitService() {
  return new UpdateUnitService(new PrismaUnitRepository())
}
