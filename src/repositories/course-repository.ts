import { Prisma, Course } from "@prisma/client";

export interface CoursesRepository {
  create(data: Prisma.CourseCreateInput): Promise<Course>;
  findMany(): Promise<Course[]>;
  findById(data: string): Promise<Course | null>
}
