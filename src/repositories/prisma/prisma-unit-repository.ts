import { prisma } from '@/lib/prisma'
import { Prisma, Unit } from '@prisma/client'
import { UnitRepository } from '../unit-repository'
import { pagination } from '@/utils/constants/pagination'

export class PrismaUnitRepository implements UnitRepository {
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

  async findMany(page: number, query?: string): Promise<Unit[]> {
    const units = await prisma.unit.findMany({
      where: {
        name: {
          contains: query,
        },
      },
      include: {
        _count: {
          select: {
            courses: true,
            segments: true,
          },
        },
      },
      take: pagination.total,
      skip: (page - 1) * pagination.total,
    })

    return units
  }

  async count(query?: string): Promise<number> {
    const units = await prisma.unit.count({
      where: {
        name: {
          contains: query,
        },
      },
    })

    return units
  }
}
