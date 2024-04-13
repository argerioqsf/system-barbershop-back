import { PrismaLeadsRepository } from '@/repositories/prisma/prisma-leads-repository'
import { GetLeadService } from '@/services/leads/get-lead-service'

export default function makeGetLeadService() {
  return new GetLeadService(new PrismaLeadsRepository())
}
