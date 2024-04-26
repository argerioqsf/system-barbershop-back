import { CoursesRepository } from '@/repositories/course-repository'
import { Course } from '@prisma/client'
import { CourseNotFoundError } from '../@errors/course-not-found-error'

interface GetCoursesServiceRequest {
  query?: string
  page: number
}

interface GetCoursesServiceResponse {
  courses: Course[]
  count: number
}

export class GetCoursesService {
  constructor(private coursesRepository: CoursesRepository) {}

  async execute({
    page,
    query,
  }: GetCoursesServiceRequest): Promise<GetCoursesServiceResponse> {
    const courses = await this.coursesRepository.findMany(page, query)
    const count = await this.coursesRepository.count(query)

    if (!courses) {
      throw new CourseNotFoundError()
    }

    return { courses, count }
  }
}
