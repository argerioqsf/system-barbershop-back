import { PrismaTimelineRepository } from '@/repositories/prisma/prisma-timeline-repository'
import { GetTimelineService } from '@/services/timeline/get-timeline-service'

export default function makeGetTimelineService() {
  return new GetTimelineService(new PrismaTimelineRepository())
}
