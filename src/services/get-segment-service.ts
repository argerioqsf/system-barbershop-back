import { SegmentsRepository } from '@/repositories/segments-repository'
import { Segment } from '@prisma/client'

interface GetSegmentsServiceResponse {
  segments: Segment[]
}

export class GetSegmentsService {
  constructor(private segmentsRepository: SegmentsRepository) {}

  async execute(): Promise<GetSegmentsServiceResponse> {
    const segments = await this.segmentsRepository.findMany()

    return { segments }
  }
}
