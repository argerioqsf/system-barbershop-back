import { CoursesRepository } from '@/repositories/course-repository'
import { CourseSegmentRepository } from '@/repositories/course-segment-repository'
import { Prisma } from '@prisma/client'
import { CourseNotFoundError } from '../@errors/course-not-found-error'

interface DeleteSegmentCourseServiceRequest {
  courseId: string
  segmentId: string
}

interface DeleteSegmentCourseServiceResponse {
  courseSegment: Prisma.BatchPayload
}

export class DeleteSegmentCourseService {
  constructor(
    private courseSegmentRepository: CourseSegmentRepository,
    private coursesRepository: CoursesRepository,
  ) {}

  async execute({
    courseId,
    segmentId,
  }: DeleteSegmentCourseServiceRequest): Promise<DeleteSegmentCourseServiceResponse> {
    const course = await this.coursesRepository.findById(courseId)

    if (!course) {
      throw new CourseNotFoundError()
    }

    const courseSegment =
      await this.courseSegmentRepository.deleteCourseSegmentById(
        segmentId,
        courseId,
      )

    return { courseSegment }
  }
}
