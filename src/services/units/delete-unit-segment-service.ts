import { SegmentsRepository } from '@/repositories/segments-repository'
import { UnitSegmentRepository } from '@/repositories/unit-segment-repository'
import { Prisma } from '@prisma/client'
import { SegmentNotFoundError } from '../@errors/segment-not-found-error'

interface DeleteUnitSegmentServiceRequest {
  unitId: string
  segmentId: string
}

interface DeleteUnitSegmentServiceResponse {
  unitSegment: Prisma.BatchPayload
}

export class DeleteUnitSegmentService {
  constructor(
    private unitSegmentRepository: UnitSegmentRepository,
    private segmentRepository: SegmentsRepository,
  ) {}

  async execute({
    unitId,
    segmentId,
  }: DeleteUnitSegmentServiceRequest): Promise<DeleteUnitSegmentServiceResponse> {
    const segment = await this.segmentRepository.findById(segmentId)

    if (!segment) {
      throw new SegmentNotFoundError()
    }

    const unitSegment = await this.unitSegmentRepository.deleteUnitSegmentById(
      unitId,
      segmentId,
    )

    return { unitSegment }
  }
}
