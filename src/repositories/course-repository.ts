import { Prisma, Course, Unit } from '@prisma/client'

export interface CoursesRepository {
  create(data: Prisma.CourseCreateInput): Promise<Course>
  findMany(): Promise<Course[]>
  findManyCourseId(ids: string[]): Promise<Course[]>
  findById(data: string): Promise<Course | null>
}
