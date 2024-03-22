import { PrismaUnitRepository } from "@/repositories/prisma/prisma-unit-repository";
import { GetUnitService } from "../get-unit-service";

export function makeGetUnitsService() {
  return new GetUnitService(new PrismaUnitRepository());
}
