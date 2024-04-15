import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'
import { PrismaLeadsRepository } from '@/repositories/prisma/prisma-leads-repository'
import { PrismaTimelineRepository } from '@/repositories/prisma/prisma-timeline-repository'
import { CreateTimelineService } from '@/services/timeline/create-timeline-service'

export function makeCreateTimelineService() {
  return new CreateTimelineService(
    new PrismaTimelineRepository(),
    new PrismaCoursesRepository(),
    new PrismaLeadsRepository(),
  )
}
