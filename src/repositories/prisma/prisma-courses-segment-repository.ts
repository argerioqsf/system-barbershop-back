import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CourseSegmentRepository } from '../course-segment-repository'

export class PrismaCourseSegmentRepository implements CourseSegmentRepository {
  async createMany(
    segmentId: string,
    coursesIds?: string[],
  ): Promise<Prisma.BatchPayload> {
    const courseSegment = await prisma.courseSegment.createMany({
      data: coursesIds
        ? coursesIds.map((courseId: string) => ({
            segmentId,
            courseId,
          }))
        : [],
    })

    return courseSegment
  }
}
