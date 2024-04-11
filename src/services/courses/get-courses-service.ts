import { CoursesRepository } from '@/repositories/course-repository'
import { Course } from '@prisma/client'
import { CourseNotFoundError } from '../@errors/course-not-found-error'

interface GetCoursesServiceRequest {
  page: number
}

interface GetCoursesServiceResponse {
  courses: Course[]
}

export class GetCoursesService {
  constructor(private coursesRepository: CoursesRepository) {}

  async execute({
    page,
  }: GetCoursesServiceRequest): Promise<GetCoursesServiceResponse> {
    const courses = await this.coursesRepository.findMany(page)

    if (!courses) {
      throw new CourseNotFoundError()
    }

    return { courses }
  }
}
