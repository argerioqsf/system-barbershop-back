import { PrismaLeadsRepository } from '@/repositories/prisma/prisma-leads-repository'
import { UpdateLeadService } from '@/services/leads/update-lead-service'

export default function makeUpdateLeadService() {
  return new UpdateLeadService(new PrismaLeadsRepository())
}
