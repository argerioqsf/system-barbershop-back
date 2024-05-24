import { prisma } from '@/lib/prisma'
import { pagination } from '@/utils/constants/pagination'
import { Course, Prisma, Segment } from '@prisma/client'
import { SegmentsRepository } from '../segments-repository'

export class PrismaSegmentsRepository implements SegmentsRepository {
  async updateById(
    id: string,
    data: Prisma.SegmentUpdateInput,
  ): Promise<Segment> {
    const segment = await prisma.segment.update({
      where: {
        id,
      },
      data,
    })

    return segment
  }

  async deleteById(id: string): Promise<Segment | null> {
    const segment = await prisma.segment.delete({
      where: {
        id,
      },
    })

    return segment
  }

  async findById(
    id: string,
  ): Promise<(Segment & { courses: { course: Course }[] }) | null> {
    const segment = await prisma.segment.findUnique({
      where: { id },
      include: {
        courses: {
          select: {
            course: true,
          },
        },
      },
    })

    return segment
  }

  async findManyListIds(ids: string[]): Promise<Segment[]> {
    const segment = await prisma.segment.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    })

    return segment
  }

  async create(data: Prisma.SegmentUncheckedCreateInput): Promise<Segment> {
    const segments = await prisma.segment.create({ data })

    return segments
  }

  async mountSelect(): Promise<Segment[]> {
    const segments = await prisma.segment.findMany({
      include: {
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
        units: {
          select: {
            unit: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })
    return segments
  }

  async findMany(page: number, query?: string): Promise<Segment[]> {
    const segments = await prisma.segment.findMany({
      where: {
        name: {
          contains: query,
        },
      },
      include: {
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
      take: pagination.total,
      skip: (page - 1) * pagination.total,
    })

    return segments
  }

  async count(query?: string): Promise<number> {
    const segments = await prisma.segment.count({
      where: {
        name: {
          contains: query,
        },
      },
    })

    return segments
  }
}
