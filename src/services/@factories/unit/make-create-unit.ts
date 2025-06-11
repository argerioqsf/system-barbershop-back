import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { CreateUnitService } from '@/services/unit/create-unit'

export function makeCreateUnitService() {
  return new CreateUnitService(new PrismaUnitRepository())
}
