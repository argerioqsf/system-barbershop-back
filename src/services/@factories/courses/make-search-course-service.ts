import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'
import { SearchCourseService } from '@/services/courses/search-course-service'

export function makeSearchCourseService() {
  return new SearchCourseService(new PrismaCoursesRepository())
}
