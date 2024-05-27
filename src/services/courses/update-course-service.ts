import { CoursesRepository } from '@/repositories/course-repository'
import { Course } from '@prisma/client'
import { CourseNotFoundError } from '../@errors/course-not-found-error'

interface UpdateCourseServiceRequest {
  id: string
  name: string
  active: boolean
}

interface UpdateCourseServiceResponse {
  course: Course
}

export class UpdateCourseService {
  constructor(private courseRepository: CoursesRepository) {}

  async execute({
    id,
    name,
    active,
  }: UpdateCourseServiceRequest): Promise<UpdateCourseServiceResponse> {
    const course = await this.courseRepository.findById(id)

    if (!course) throw new CourseNotFoundError()

    const updateCourse = await this.courseRepository.updateById(id, {
      name,
      active,
    })

    return { course: updateCourse }
  }
}
