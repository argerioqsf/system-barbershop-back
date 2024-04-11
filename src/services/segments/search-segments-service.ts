import { SegmentsRepository } from '@/repositories/segments-repository'
import { Segment } from '@prisma/client'

interface SearchSegmentsServiceRequest {
  query: string
  page: number
}

interface SearchSegmentsServiceResponse {
  segments: Segment[]
}

export class SearchSegmentsService {
  constructor(private segmentsRepository: SegmentsRepository) {}

  async execute({
    query,
    page,
  }: SearchSegmentsServiceRequest): Promise<SearchSegmentsServiceResponse> {
    const segments = await this.segmentsRepository.searchMany(query, page)

    return { segments }
  }
}
