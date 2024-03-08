import { Prisma, course } from "@prisma/client";

export interface CoursesRepository {
  create(data: Prisma.courseCreateInput): Promise<course>;
  findMany(): Promise<course[]>;
}
