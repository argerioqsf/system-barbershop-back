import { CoursesRepository } from '@/repositories/course-repository'
import { UnitCourseRepository } from '@/repositories/unit-course-repository'
import { Prisma } from '@prisma/client'
import { CourseNotFoundError } from '../@errors/course-not-found-error'

interface DeleteUnitCourseServiceRequest {
  unitId: string
  courseId: string
}

interface DeleteUnitCourseServiceResponse {
  unitCourse: Prisma.BatchPayload
}

export class DeleteUnitCourseService {
  constructor(
    private unitCourseRepository: UnitCourseRepository,
    private coursesRepository: CoursesRepository,
  ) {}

  async execute({
    unitId,
    courseId,
  }: DeleteUnitCourseServiceRequest): Promise<DeleteUnitCourseServiceResponse> {
    const course = await this.coursesRepository.findById(courseId)

    if (!course) {
      throw new CourseNotFoundError()
    }

    const unitCourse = await this.unitCourseRepository.deleteUnitCourseById(
      unitId,
      courseId,
    )

    return { unitCourse }
  }
}
