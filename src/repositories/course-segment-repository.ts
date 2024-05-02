import { CourseSegment, Prisma } from '@prisma/client'

export interface CourseSegmentRepository {
  createMany(
    segmentId: string,
    coursesIds?: string[],
  ): Promise<Prisma.BatchPayload>

  deleteCourseSegmentById(
    segmentId: string,
    courseId: string,
  ): Promise<Prisma.BatchPayload>
}
