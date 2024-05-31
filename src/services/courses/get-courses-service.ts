import { CoursesRepository } from '@/repositories/course-repository'
import { Course, Prisma } from '@prisma/client'
import { CourseNotFoundError } from '../@errors/course-not-found-error'

interface GetCoursesServiceRequest {
  name?: string
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
    name,
  }: GetCoursesServiceRequest): Promise<GetCoursesServiceResponse> {
    const where: Prisma.CourseWhereInput = {
      name: { contains: name },
    }
    const courses = await this.coursesRepository.findMany(page, where)
    const count = await this.coursesRepository.count(where)

    if (!courses) {
      throw new CourseNotFoundError()
    }

    return { courses, count }
  }
}
