import { CoursesRepository } from '@/repositories/course-repository'
import { Course } from '@prisma/client'
import { CourseNotFoundError } from '../@errors/course-not-found-error'

interface GetCourseServiceRequest {
  id: string
}

interface GetCourseServiceResponse {
  course: Course
}

export class GetCourseService {
  constructor(private courseRepository: CoursesRepository) {}

  async execute({
    id,
  }: GetCourseServiceRequest): Promise<GetCourseServiceResponse> {
    const course = await this.courseRepository.findById(id)

    if (!course) throw new CourseNotFoundError()

    return { course }
  }
}
