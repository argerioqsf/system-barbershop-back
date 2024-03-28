import { PrismaUnitCourseRepository } from '@/repositories/prisma/prisma-unit-course-repository'
import { CreateUnitCourseService } from '../create-unit-course-service'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'

export function makeCreateUnitCourseService() {
  return new CreateUnitCourseService(
    new PrismaUnitCourseRepository(), 
    new PrismaUnitRepository(), 
    new PrismaCoursesRepository()
  )
}
