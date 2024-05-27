import { PrismaLeadsRepository } from '@/repositories/prisma/prisma-leads-repository'
import { CreateLeadPublicService } from '@/services/leads/create-lead-publico-service'

export default function makeCreateLeadPublicService() {
  return new CreateLeadPublicService(new PrismaLeadsRepository())
}
