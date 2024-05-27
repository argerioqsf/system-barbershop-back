import { PrismaLeadsRepository } from '@/repositories/prisma/prisma-leads-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { GetLeadsService } from '@/services/leads/get-leads-service'

export default function makeGetLeadsService() {
  return new GetLeadsService(
    new PrismaLeadsRepository(),
    new PrismaProfilesRepository(),
  )
}
