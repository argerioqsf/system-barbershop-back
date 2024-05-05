import { PrismaUnitCourseRepository } from '@/repositories/prisma/prisma-unit-course-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PrismaUnitSegmentRepository } from '@/repositories/prisma/prisma-unit-segment-repository'
import { UpdateUnitService } from '@/services/units/update-unit-service'

export function makeUpdateUnitService() {
  return new UpdateUnitService(
    new PrismaUnitRepository(),
    new PrismaUnitCourseRepository(),
    new PrismaUnitSegmentRepository(),
  )
}
