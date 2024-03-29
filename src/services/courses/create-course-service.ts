import { CoursesRepository } from '@/repositories/course-repository'
import { Course } from '@prisma/client'

interface CreateCourseServiceRequest {
  name: string
  active: boolean
}

interface CreateCourseServiceResponse {
  course: Course
}

export class CreateCourseService {
  constructor(private courseRepository: CoursesRepository) {}

  async execute({
    name,
    active,
  }: CreateCourseServiceRequest): Promise<CreateCourseServiceResponse> {
    const course = await this.courseRepository.create({ name, active })

    return { course }
  }
}
