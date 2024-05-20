import { PrismaLeadsRepository } from '@/repositories/prisma/prisma-leads-repository'
import { UpdateLeadArchivedService } from '@/services/leads/update-lead-archived-service'

export default function makeUpdateArchivedLeadService() {
  return new UpdateLeadArchivedService(new PrismaLeadsRepository())
}
