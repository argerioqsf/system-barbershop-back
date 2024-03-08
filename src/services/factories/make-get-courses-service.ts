import { PrismaCoursesRepository } from "@/repositories/prisma/prisma-courses-repository";
import { GetCoursesService } from "../get-courses-service";

export function makeGetCoursesService() {
  return new GetCoursesService(new PrismaCoursesRepository());
}
