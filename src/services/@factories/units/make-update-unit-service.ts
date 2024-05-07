import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'
import { PrismaSegmentsRepository } from '@/repositories/prisma/prisma-segments-repository'
import { PrismaUnitCourseRepository } from '@/repositories/prisma/prisma-unit-course-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PrismaUnitSegmentRepository } from '@/repositories/prisma/prisma-unit-segment-repository'
import { UpdateUnitService } from '@/services/units/update-unit-service'

export function makeUpdateUnitService() {
  return new UpdateUnitService(
    new PrismaUnitRepository(),
    new PrismaCoursesRepository(),
    new PrismaSegmentsRepository(),
    new PrismaUnitCourseRepository(),
    new PrismaUnitSegmentRepository(),
  )
}
