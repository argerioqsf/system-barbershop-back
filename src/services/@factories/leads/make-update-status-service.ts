import { PrismaLeadsRepository } from '@/repositories/prisma/prisma-leads-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { UpdateLeadStatusService } from '@/services/leads/update-lead-status'

export default function makeUpdateLeadStartService() {
  return new UpdateLeadStatusService(
    new PrismaLeadsRepository(),
    new PrismaProfilesRepository(),
  )
}
