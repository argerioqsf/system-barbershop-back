import { Prisma, UnitSegment } from '@prisma/client'
import {} from '../unit-course-repository'
import { prisma } from '@/lib/prisma'
import { UnitSegmentRepository } from '../unit-segment-repository'

export class PrismaUnitSegmentRepository implements UnitSegmentRepository {
  deleteUnitSegmentById(
    unitId: string,
    segmentId: string,
  ): Promise<Prisma.BatchPayload> {
    const unitSegment = prisma.unitSegment.deleteMany({
      where: {
        unitId,
        segmentId,
      },
    })

    return unitSegment
  }

  async createMany(
    unitId: string,
    segmentsIds?: string[],
  ): Promise<Prisma.BatchPayload> {
    const unitSegment = await prisma.unitSegment.createMany({
      data: segmentsIds
        ? segmentsIds.map((segmentId: string) => ({
            unitId,
            segmentId,
          }))
        : [],
    })

    return unitSegment
  }

  async create(
    data: Prisma.UnitSegmentUncheckedCreateInput,
  ): Promise<UnitSegment> {
    const unitSegment = await prisma.unitSegment.create({ data })

    return unitSegment
  }
}
