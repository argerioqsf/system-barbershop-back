import { prisma } from "@/lib/prisma";
import { Prisma, Unit } from "@prisma/client";
import { UnitRepository } from "../unit-repository";

export class PrismaUnitRepository implements UnitRepository {
  async create(data: Prisma.UnitCreateInput): Promise<Unit> {
    const Unit = await prisma.unit.create({ data });

    return Unit;
  }
  async findMany(): Promise<Unit[]> {
    const units = await prisma.unit.findMany();

    return units;
  }
}
