import { SegmentsRepository } from '@/repositories/segments-repository'
import { Segment } from '@prisma/client'

interface CreateSegmentServiceRequest {
  name: string
}

interface CreateSegmentServiceResponse {
  segments: Segment
}

export class CreateSegmentService {
  constructor(private segmentsRepository: SegmentsRepository) {}

  async execute({
    name,
  }: CreateSegmentServiceRequest): Promise<CreateSegmentServiceResponse> {
    const segments = await this.segmentsRepository.create({
      name,
    })

    return { segments }
  }
}
