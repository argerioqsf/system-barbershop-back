import { Prisma, UnitCourses } from "@prisma/client";
import { UnitCourseRepository } from "../unit-course-repository";
import { prisma } from "@/lib/prisma";

export class PrismaUnitCourseRepository implements UnitCourseRepository {
  async createMany(unitId: string, coursesIds?: string[]): Promise<Prisma.BatchPayload> {
    const unitCourses = await prisma.unitCourses.createMany({
      data: coursesIds ? coursesIds.map((courseId: string) => ({
        unitId,
        courseId
      })) : []
    })

    return unitCourses
  }
  
  async create(data: Prisma.UnitCoursesUncheckedCreateInput): Promise<UnitCourses> {
    const unitCourses = await prisma.unitCourses.create({ data });

    return unitCourses
  }
}
