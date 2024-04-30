import { Prisma } from '@prisma/client'

export interface CourseSegmentRepository {
  createMany(
    segmentId: string,
    coursesIds?: string[],
  ): Promise<Prisma.BatchPayload>
}
