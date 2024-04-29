import { CoursesRepository } from '@/repositories/course-repository'
import { Course } from '@prisma/client'
import { CourseNotFoundError } from '../@errors/course-not-found-error'

interface MountSelectCourseResponse {
  courses: Omit<Course, 'active'>[]
}

export class MountSelectCourseService {
  constructor(private coursesRepository: CoursesRepository) {}

  async execute(): Promise<MountSelectCourseResponse> {
    const courses = await this.coursesRepository.mountSelect()

    if (!courses) {
      throw new CourseNotFoundError()
    }

    return { courses }
  }
}
