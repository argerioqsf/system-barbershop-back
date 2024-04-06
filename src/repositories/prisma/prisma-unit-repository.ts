import { prisma } from "@/lib/prisma";
import { Course, Prisma, Unit, UnitCourses } from "@prisma/client";
import { UnitRepository } from "../unit-repository";

export class PrismaUnitRepository implements UnitRepository {
  async findById(id: string): Promise<Unit | null> {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        courses: {
          select: {
            course: true
          }
        },
        segments: {
          select: {
            segment: true
          }
        }
      }
    });

    return unit;
  }

  async create(data: Prisma.UnitCreateInput): Promise<Unit> {
    const Unit = await prisma.unit.create({
      data: {
        name: data.name,
      },
    });

    return Unit;
  }
  
  async findMany(): Promise<Unit[]> {
    const units = await prisma.unit.findMany({
      include: {
        courses: {
          select: {
            course: true
          }
        },
        segments: {
          select: {
            segment: true
          }
        }
      }
    });

    return units;
  }
}
