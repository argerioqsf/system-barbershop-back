import { CourseSegmentRepository } from '@/repositories/course-segment-repository'
import { SegmentsRepository } from '@/repositories/segments-repository'
import { Prisma, Segment } from '@prisma/client'
import { SegmentNotFoundError } from '../@errors/segment-not-found-error'

interface UpdateSegmentServiceRequest {
  id: string
  name: string
  coursesIds?: string[]
}

interface UpdateSegmentServiceResponse {
  segment: Segment
  courseSegment: Prisma.BatchPayload
}

export class UpdateSegmentService {
  constructor(
    private segmentRepository: SegmentsRepository,
    private coursesSegmentRepository: CourseSegmentRepository,
  ) {}

  async execute({
    id,
    name,
    coursesIds,
  }: UpdateSegmentServiceRequest): Promise<UpdateSegmentServiceResponse> {
    const segment = await this.segmentRepository.findById(id)

    if (!segment) throw new SegmentNotFoundError()

    const segmentUpdate = await this.segmentRepository.updateById(id, { name })

    const courseSegment = await this.coursesSegmentRepository.createMany(
      segment.id,
      coursesIds,
    )

    return { segment: segmentUpdate, courseSegment }
  }
}
