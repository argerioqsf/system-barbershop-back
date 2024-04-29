import { Course, Prisma } from '@prisma/client'

export interface CoursesRepository {
  create(data: Prisma.CourseCreateInput): Promise<Course>
  findMany(page: number, query?: string): Promise<Course[]>
  count(query?: string): Promise<number>
  findManyListIds(ids: string[]): Promise<Course[]>
  findById(data: string): Promise<Course | null>
  mountSelect(): Promise<Omit<Course, 'active'>[]>
}
