import { PrismaSegmentsRepository } from '@/repositories/prisma/prisma-segments-repository'
import { DeleteSegmentService } from '@/services/segments/delete-segment-service'

export function makeDeleteSegmentService() {
  return new DeleteSegmentService(new PrismaSegmentsRepository())
}
