import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'
import { UpdateCourseService } from '@/services/courses/update-course-service'

export function makeUpdateCourseService() {
  return new UpdateCourseService(new PrismaCoursesRepository())
}
