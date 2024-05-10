import { Prisma, UnitCourses } from '@prisma/client'

export interface UnitCourseRepository {
  create(data: Prisma.UnitCoursesUncheckedCreateInput): Promise<UnitCourses>
  createMany(
    unitId: string,
    coursesIds?: string[],
  ): Promise<Prisma.BatchPayload>
  deleteUnitCourseById(
    unitId: string,
    courseId: string,
  ): Promise<Prisma.BatchPayload>
  deleteMany(
    unitId: string,
    coursesIds?: string[],
  ): Promise<Prisma.BatchPayload>
}
