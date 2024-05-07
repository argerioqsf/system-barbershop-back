import { Prisma, UnitCourses } from '@prisma/client'
import { UnitCourseRepository } from '../unit-course-repository'
import { prisma } from '@/lib/prisma'

export class PrismaUnitCourseRepository implements UnitCourseRepository {
  async deleteUnitCourseById(
    unitId: string,
    courseId: string,
  ): Promise<Prisma.BatchPayload> {
    const unitCourse = await prisma.unitCourses.deleteMany({
      where: {
        unitId,
        courseId,
      },
    })

    return unitCourse
  }

  async createMany(
    unitId: string,
    coursesIds?: string[],
  ): Promise<Prisma.BatchPayload> {
    const unitCourses = await prisma.unitCourses.createMany({
      data: coursesIds
        ? coursesIds.map((courseId: string) => ({
            unitId,
            courseId,
          }))
        : [],
    })

    return unitCourses
  }

  async create(
    data: Prisma.UnitCoursesUncheckedCreateInput,
  ): Promise<UnitCourses> {
    const unitCourses = await prisma.unitCourses.create({ data })

    return unitCourses
  }

  async deleteMany(
    unitId: string,
    coursesIds?: string[],
  ): Promise<Prisma.BatchPayload> {
    const courseSegment = await prisma.unitCourses.deleteMany({
      where: {
        unitId,
        courseId: {
          in: coursesIds,
        },
      },
    })

    return courseSegment
  }
}
