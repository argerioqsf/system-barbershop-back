import { PrismaUnitRepository } from "@/repositories/prisma/prisma-unit-repository";
import { CreateUnitService } from "../create-unit-service";

export function makeCreateUnitService() {
  return new CreateUnitService(new PrismaUnitRepository());
}
