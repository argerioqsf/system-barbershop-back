import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'
import { PrismaUnitCourseRepository } from '@/repositories/prisma/prisma-unit-course-repository'
import { DeleteUnitCourseService } from '@/services/units/delete-unit-course-service'

export function makeDeleteUnitCourseService() {
  return new DeleteUnitCourseService(
    new PrismaUnitCourseRepository(),
    new PrismaCoursesRepository(),
  )
}
