import { prisma } from '@/lib/prisma'
import { Prisma, Unit } from '@prisma/client'
import { UnitRepository } from '../unit-repository'

export class PrismaUnitRepository implements UnitRepository {
  async searchMany(query: string, page: number): Promise<Unit[]> {
    const units = await prisma.unit.findMany({
      where: {
        name: {
          contains: query,
        },
      },
      take: 10,
      skip: (page - 1) * 10,
    })

    return units
  }

  async findById(id: string): Promise<Unit | null> {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        courses: {
          select: {
            course: true,
          },
        },
        segments: {
          select: {
            segment: true,
          },
        },
      },
    })

    return unit
  }

  async create(data: Prisma.UnitCreateInput): Promise<Unit> {
    const Unit = await prisma.unit.create({
      data: {
        name: data.name,
      },
    })

    return Unit
  }

  async findMany(page: number): Promise<Unit[]> {
    const units = await prisma.unit.findMany({
      include: {
        courses: {
          select: {
            course: true,
          },
          take: 10,
          skip: (page - 1) * 10,
        },
        segments: {
          select: {
            segment: true,
          },
          take: 10,
          skip: (page - 1) * 10,
        },
      },
      take: 10,
      skip: (page - 1) * 10,
    })

    return units
  }
}
