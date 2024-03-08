import { PrismaCoursesRepository } from "@/repositories/prisma/prisma-courses-repository";
import { CreateCourseService } from "../create-course-service";

export default function makeCreateCourseService() {
  return new CreateCourseService(new PrismaCoursesRepository());
}
