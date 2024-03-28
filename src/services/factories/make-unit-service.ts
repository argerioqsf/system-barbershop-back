import { PrismaUnitRepository } from "@/repositories/prisma/prisma-unit-repository";
import { CreateUnitService } from "../create-unit-service";
import { PrismaCoursesRepository } from "@/repositories/prisma/prisma-courses-repository";

export function makeCreateUnitService() {
  return new CreateUnitService(new PrismaUnitRepository());
}
