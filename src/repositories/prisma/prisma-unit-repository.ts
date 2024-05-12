import { prisma } from '@/lib/prisma'
import { Course, Prisma, Segment, Unit } from '@prisma/client'
import { UnitRepository } from '../unit-repository'
import { pagination } from '@/utils/constants/pagination'

export class PrismaUnitRepository implements UnitRepository {
  async updateById(id: string, data: Prisma.UnitUpdateInput): Promise<Unit> {
    const unit = await prisma.unit.update({
      where: { id },
      data,
    })

    return unit
  }

  async deleteById(id: string): Promise<Unit | null> {
    const unit = await prisma.unit.delete({
      where: { id },
    })

    return unit
  }

  async findById(id: string): Promise<
    | (Unit & {
        courses: { course: Course }[]
        segments: { segment: Segment }[]
      })
    | null
  > {
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
            segment: {
              select: {
                id: true,
                name: true,
                courses: {
                  select: {
                    course: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
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
