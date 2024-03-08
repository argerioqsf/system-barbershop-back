import { Prisma, course } from "@prisma/client";
import { CoursesRepository } from "../course-repository";
import { prisma } from "@/lib/prisma";

export class PrismaCoursesRepository implements CoursesRepository {
  async create(data: Prisma.courseCreateInput): Promise<course> {
    const course = await prisma.course.create({ data });

    return course;
  }

  async findMany(): Promise<course[]> {
    const courses = await prisma.course.findMany();

    return courses;
  }
}
