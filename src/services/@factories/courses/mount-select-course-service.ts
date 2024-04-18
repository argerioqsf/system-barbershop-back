import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'
import { MountSelectCourseService } from '@/services/courses/mount-select-course-service'

export function makeMountSelectCourseService() {
  return new MountSelectCourseService(new PrismaCoursesRepository())
}
