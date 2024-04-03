import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { CreateUnitService } from '@/services/units/create-unit-service'

export function makeCreateUnitService() {
  return new CreateUnitService(
    new PrismaUnitRepository(),
    new PrismaCoursesRepository(),
  )
}
