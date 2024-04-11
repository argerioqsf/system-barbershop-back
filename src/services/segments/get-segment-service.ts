import { SegmentsRepository } from '@/repositories/segments-repository'
import { Segment } from '@prisma/client'

interface GetSegmentsServiceRequest {
  page: number
}

interface GetSegmentsServiceResponse {
  segments: Segment[]
}

export class GetSegmentsService {
  constructor(private segmentsRepository: SegmentsRepository) {}

  async execute({
    page,
  }: GetSegmentsServiceRequest): Promise<GetSegmentsServiceResponse> {
    const segments = await this.segmentsRepository.findMany(page)

    return { segments }
  }
}
