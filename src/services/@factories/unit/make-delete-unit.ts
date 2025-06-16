import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { DeleteUnitService } from '@/services/unit/delete-unit'

export function makeDeleteUnitService() {
  return new DeleteUnitService(new PrismaUnitRepository())
}
