import { CoursesRepository } from '@/repositories/course-repository'
import { CourseSegmentRepository } from '@/repositories/course-segment-repository'
import { SegmentsRepository } from '@/repositories/segments-repository'
import { Prisma, Segment } from '@prisma/client'
import { CourseNotFoundError } from '../@errors/course-not-found-error'

interface CreateSegmentServiceRequest {
  name: string
  coursesIds?: string[]
}

interface CreateSegmentServiceResponse {
  segment: Segment
  courseSegment: Prisma.BatchPayload
}

export class CreateSegmentService {
  constructor(
    private segmentsRepository: SegmentsRepository,
    private coursesRepository: CoursesRepository,
    private coursesSegments: CourseSegmentRepository,
  ) {}

  async execute({
    name,
    coursesIds,
  }: CreateSegmentServiceRequest): Promise<CreateSegmentServiceResponse> {
    const courses = coursesIds
      ? await this.coursesRepository.findManyListIds(coursesIds)
      : []

    if (coursesIds && courses.length !== coursesIds.length) {
      throw new CourseNotFoundError()
    }

    const segment = await this.segmentsRepository.create({
      name,
    })

    const courseSegment = await this.coursesSegments.createMany(
      segment.id,
      coursesIds,
    )

    return { segment, courseSegment }
  }
}
