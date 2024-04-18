import { SegmentsRepository } from '@/repositories/segments-repository'
import { Segment } from '@prisma/client'

interface MountSelectServiceResponse {
  segments: Segment[]
}

export class MountSelectSegmentsService {
  constructor(private segmentsRepository: SegmentsRepository) {}

  async execute(): Promise<MountSelectServiceResponse> {
    const segments = await this.segmentsRepository.mountSelect()

    return { segments }
  }
}
