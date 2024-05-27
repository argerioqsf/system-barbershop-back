import { PrismaSegmentsRepository } from '@/repositories/prisma/prisma-segments-repository'
import { PrismaUnitSegmentRepository } from '@/repositories/prisma/prisma-unit-segment-repository'
import { DeleteUnitSegmentService } from '@/services/units/delete-unit-segment-service'

export function makeDeleteUnitSegmentService() {
  return new DeleteUnitSegmentService(
    new PrismaUnitSegmentRepository(),
    new PrismaSegmentsRepository(),
  )
}
