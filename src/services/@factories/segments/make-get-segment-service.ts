import { PrismaSegmentsRepository } from '@/repositories/prisma/prisma-segments-repository'
import { GetSegmentService } from '@/services/segments/segment-service'

export function makeGetSegmentService() {
  return new GetSegmentService(new PrismaSegmentsRepository())
}
