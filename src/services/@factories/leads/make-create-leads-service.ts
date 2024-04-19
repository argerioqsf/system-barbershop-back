import { PrismaLeadsRepository } from '@/repositories/prisma/prisma-leads-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaTimelineRepository } from '@/repositories/prisma/prisma-timeline-repository'
import { CreateLeadsService } from '@/services/leads/create-leads-service'

export default function makeCreateLeadsService() {
  return new CreateLeadsService(
    new PrismaLeadsRepository(),
    new PrismaProfilesRepository(),
    new PrismaTimelineRepository(),
  )
}
