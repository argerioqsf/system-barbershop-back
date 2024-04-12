import { PrismaLeadsRepository } from '@/repositories/prisma/prisma-leads-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { CreateLeadsService } from '@/services/leads/create-leads-service'

export default function makeCreateLeadsService() {
  return new CreateLeadsService(
    new PrismaLeadsRepository(),
    new PrismaProfilesRepository(),
  )
}
