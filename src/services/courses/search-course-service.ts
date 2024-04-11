import { CoursesRepository } from '@/repositories/course-repository'
import { Course } from '@prisma/client'

interface SearchCourseServiceRequest {
  query: string
  page: number
}

interface SearchCourseServiceResponse {
  courses: Course[]
}

export class SearchCourseService {
  constructor(private coursesRepository: CoursesRepository) {}

  async execute({
    query,
    page,
  }: SearchCourseServiceRequest): Promise<SearchCourseServiceResponse> {
    const courses = await this.coursesRepository.searchMany(query, page)

    return { courses }
  }
}
