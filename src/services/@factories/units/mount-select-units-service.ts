import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { MountSelectUnitsService } from '@/services/units/mount-select-units-service'

export function makeMountSelectUnitsService() {
  return new MountSelectUnitsService(new PrismaUnitRepository())
}
