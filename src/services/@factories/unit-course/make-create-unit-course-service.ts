import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'
import { PrismaUnitCourseRepository } from '@/repositories/prisma/prisma-unit-course-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { CreateUnitCourseService } from '@/services/unit-courses/create-unit-course-service'

export function makeCreateUnitCourseService() {
  return new CreateUnitCourseService(
    new PrismaUnitCourseRepository(), 
    new PrismaUnitRepository(), 
    new PrismaCoursesRepository()
  )
}
