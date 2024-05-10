import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CourseSegmentRepository } from '../course-segment-repository'

export class PrismaCourseSegmentRepository implements CourseSegmentRepository {
  async deleteCourseSegmentById(
    segmentId: string,
    courseId: string,
  ): Promise<Prisma.BatchPayload> {
    const courseSegment = await prisma.courseSegment.deleteMany({
      where: {
        segmentId,
        courseId,
      },
    })

    return courseSegment
  }

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

  async deleteMany(
    segmentId: string,
    coursesIds?: string[],
  ): Promise<Prisma.BatchPayload> {
    const courseSegment = await prisma.courseSegment.deleteMany({
      where: {
        segmentId,
        courseId: {
          in: coursesIds,
        },
      },
    })

    return courseSegment
  }
}
