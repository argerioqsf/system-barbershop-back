import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'
import { GetCourseService } from '@/services/courses/get-course-service'

export function makeGetCourseService() {
  return new GetCourseService(new PrismaCoursesRepository())
}
