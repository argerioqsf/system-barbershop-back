import { SegmentsRepository } from '@/repositories/segments-repository'
import { Segment } from '@prisma/client'
import { SegmentNotFoundError } from '../@errors/segment-not-found-error'

interface GetSegmentServiceRequest {
  id: string
}

interface GetSegmentServiceResponse {
  segment: Segment
}

export class GetSegmentService {
  constructor(private segmentRepository: SegmentsRepository) {}

  async execute({
    id,
  }: GetSegmentServiceRequest): Promise<GetSegmentServiceResponse> {
    const segment = await this.segmentRepository.findById(id)

    if (!segment) throw new SegmentNotFoundError()

    return { segment }
  }
}
