import { Prisma, Segment } from '@prisma/client'
import { SegmentsRepository } from '../segments-repository'
import { prisma } from '@/lib/prisma'
import { pagination } from '@/utils/constants/pagination'

export class PrismaSegmentsRepository implements SegmentsRepository {
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

  async create(data: Prisma.SegmentCreateInput): Promise<Segment> {
    const segments = await prisma.segment.create({ data })

    return segments
  }

  async mountSelect(): Promise<Segment[]> {
    const segments = await prisma.segment.findMany()
    return segments
  }

  async findMany(page: number, query?: string): Promise<Segment[]> {
    const segments = await prisma.segment.findMany({
      where: {
        name: {
          contains: query,
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
