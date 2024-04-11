import { PrismaSegmentsRepository } from '@/repositories/prisma/prisma-segments-repository'
import { GetSegmentsService } from '@/services/segments/get-segment-service'

export function makeGetSegmentsService() {
  return new GetSegmentsService(new PrismaSegmentsRepository())
}
