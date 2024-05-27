import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'
import { DeleteCourseService } from '@/services/courses/delete-course-service'

export function makeDeleteCourseService() {
  return new DeleteCourseService(new PrismaCoursesRepository())
}
