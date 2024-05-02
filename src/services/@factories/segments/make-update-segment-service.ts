import { PrismaCourseSegmentRepository } from '@/repositories/prisma/prisma-courses-segment-repository'
import { PrismaSegmentsRepository } from '@/repositories/prisma/prisma-segments-repository'
import { UpdateSegmentService } from '@/services/segments/update-segment-service'

export function makeUpdateSegmentsService() {
  return new UpdateSegmentService(
    new PrismaSegmentsRepository(),
    new PrismaCourseSegmentRepository(),
  )
}
