import { PrismaCoursesRepository } from "@/repositories/prisma/prisma-courses-repository";
import { GetCoursesService } from "@/services/courses/get-courses-service";

export function makeGetCoursesService() {
  return new GetCoursesService(new PrismaCoursesRepository());
}
