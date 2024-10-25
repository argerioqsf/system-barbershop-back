import { PrismaCycleRepository } from '@/repositories/prisma/prisma-cycle-repository'
import { PrismaLeadsRepository } from '@/repositories/prisma/prisma-leads-repository'
import { PrismaTimelineRepository } from '@/repositories/prisma/prisma-timeline-repository'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { GetGraphicService } from '@/services/graphics/get-graphics-service'

export function makeGetGraphicsService() {
  return new GetGraphicService(
    new PrismaLeadsRepository(),
    new PrismaUsersRepository(),
    new PrismaCycleRepository(),
    new PrismaTimelineRepository(),
  )
}
