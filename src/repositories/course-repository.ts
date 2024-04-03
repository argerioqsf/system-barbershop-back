import { Prisma, Course, Unit } from '@prisma/client'

export interface CoursesRepository {
  create(data: Prisma.CourseCreateInput): Promise<Course>
  findMany(): Promise<Course[]>
  findById(data: string): Promise<Course | null>
  addUnitCourseId(
    id: string,
    unit: Unit[],
  ): Promise<(Course & { unit: Unit }) | null>
}
