import { Course, Prisma } from '@prisma/client'

export interface CoursesRepository {
  create(data: Prisma.CourseCreateInput): Promise<Course>
  findMany(page: number, where: Prisma.CourseWhereInput): Promise<Course[]>
  count(where: Prisma.CourseWhereInput): Promise<number>
  findManyListIds(ids: string[]): Promise<Course[]>
  findById(data: string): Promise<Course | null>
  mountSelect(): Promise<Omit<Course, 'active'>[]>
  deleteById(id: string): Promise<Course | null>
  updateById(id: string, data: Prisma.CourseUpdateInput): Promise<Course>
}
