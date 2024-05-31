import { SegmentsRepository } from '@/repositories/segments-repository'
import { Prisma, Segment } from '@prisma/client'

interface GetSegmentsServiceRequest {
  name?: string
  page: number
}

interface GetSegmentsServiceResponse {
  segments: Segment[]
  count: number
}

export class GetSegmentsService {
  constructor(private segmentsRepository: SegmentsRepository) {}

  async execute({
    name,
    page,
  }: GetSegmentsServiceRequest): Promise<GetSegmentsServiceResponse> {
    const where: Prisma.SegmentWhereInput = {
      name: { contains: name },
    }
    const segments = await this.segmentsRepository.findMany(page, where)
    const count = await this.segmentsRepository.count(where)

    return { segments, count }
  }
}
