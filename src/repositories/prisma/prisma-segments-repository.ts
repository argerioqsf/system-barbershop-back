import { Prisma, Segment } from '@prisma/client'
import { SegmentsRepository } from '../segments-repository'
import { prisma } from '@/lib/prisma'

export class PrismaSegmentsRepository implements SegmentsRepository {
  async searchMany(query: string, page: number): Promise<Segment[]> {
    const segments = await prisma.segment.findMany({
      where: {
        name: {
          contains: query,
        },
      },
      take: 10,
      skip: (page - 1) * 10,
    })

    return segments
  }

  async findManyListIds(
    ids: string[],
  ): Promise<{ id: string; name: string }[]> {
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

  async findMany(page: number): Promise<Segment[]> {
    const segments = await prisma.segment.findMany({
      take: 10,
      skip: (page - 1) * 10,
    })

    return segments
  }
}
