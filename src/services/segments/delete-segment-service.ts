import { SegmentsRepository } from '@/repositories/segments-repository'
import { Segment } from '@prisma/client'
import { CourseNotFoundError } from '../@errors/course-not-found-error'

interface DeleteSegmentServiceRequest {
  id: string
}

interface DeleteSegmentServiceResponse {
  segment: Segment
}

export class DeleteSegmentService {
  constructor(private segmentRepository: SegmentsRepository) {}

  async execute({
    id,
  }: DeleteSegmentServiceRequest): Promise<DeleteSegmentServiceResponse> {
    const segment = await this.segmentRepository.deleteById(id)

    if (!segment) throw new CourseNotFoundError()

    return { segment }
  }
}
