import { SegmentsRepository } from '@/repositories/segments-repository'
import { Segment } from '@prisma/client'

interface GetSegmentsServiceRequest {
  query?: string
  page: number
}

interface GetSegmentsServiceResponse {
  segments: Segment[]
}

export class GetSegmentsService {
  constructor(private segmentsRepository: SegmentsRepository) {}

  async execute({
    query,
    page,
  }: GetSegmentsServiceRequest): Promise<GetSegmentsServiceResponse> {
    const segments = await this.segmentsRepository.findMany(page, query)

    return { segments }
  }
}
