import { Prisma, UnitCourses } from "@prisma/client";
import { UnitCourseRepository } from "../unit-course-repository";
import { prisma } from "@/lib/prisma";

export class PrismaUnitCourseRepository implements UnitCourseRepository {
  async create(data: Prisma.UnitCoursesUncheckedCreateInput): Promise<UnitCourses> {
    const unitCourses = await prisma.unitCourses.create({ data });

    return unitCourses
  }
}
