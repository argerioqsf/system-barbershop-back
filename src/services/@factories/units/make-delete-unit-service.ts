import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { DeleteUnitService } from '@/services/units/delete-unit-service'

export function makeDeleteUnitService() {
  return new DeleteUnitService(new PrismaUnitRepository())
}
