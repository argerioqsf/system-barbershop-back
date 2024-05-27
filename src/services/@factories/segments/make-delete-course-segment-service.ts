import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'
import { PrismaCourseSegmentRepository } from '@/repositories/prisma/prisma-courses-segment-repository'
import { DeleteSegmentCourseService } from '@/services/segments/delete-course-segment-service'

export function makeDeleteSegmentCourseService() {
  return new DeleteSegmentCourseService(
    new PrismaCourseSegmentRepository(),
    new PrismaCoursesRepository(),
  )
}
