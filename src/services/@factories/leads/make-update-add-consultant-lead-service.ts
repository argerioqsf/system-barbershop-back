import { PrismaLeadsRepository } from '@/repositories/prisma/prisma-leads-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { UpdateAddConsultantLeadService } from '@/services/leads/update-add-consultant-service'

export default function makeUpdateAddConsultantLeadService() {
  return new UpdateAddConsultantLeadService(
    new PrismaLeadsRepository(),
    new PrismaProfilesRepository(),
  )
}
