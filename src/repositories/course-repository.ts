import { Course, Prisma } from '@prisma/client'

export interface CoursesRepository {
  create(data: Prisma.CourseCreateInput): Promise<Course>
  findMany(page: number, query?: string): Promise<Course[]>
  findManyListIds(ids: string[]): Promise<Course[]>
  findById(data: string): Promise<Course | null>
}
