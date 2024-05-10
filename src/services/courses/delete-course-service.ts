import { CoursesRepository } from '@/repositories/course-repository'
import { Course } from '@prisma/client'
import { CourseNotFoundError } from '../@errors/course-not-found-error'

interface DeleteCourseServiceRequest {
  id: string
}

interface DeleteCourseServiceResponse {
  course: Course
}

export class DeleteCourseService {
  constructor(private courseRepository: CoursesRepository) {}

  async execute({
    id,
  }: DeleteCourseServiceRequest): Promise<DeleteCourseServiceResponse> {
    const course = await this.courseRepository.deleteById(id)

    if (!course) throw new CourseNotFoundError()

    return { course }
  }
}
