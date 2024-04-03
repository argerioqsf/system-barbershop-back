import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { GetUnitService } from '@/services/units/get-unit-service'

export function makeGetUnitsService() {
  return new GetUnitService(
    new PrismaUnitRepository(),
    new PrismaCoursesRepository(),
  )
}
