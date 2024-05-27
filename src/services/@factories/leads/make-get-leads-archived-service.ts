import { PrismaLeadsRepository } from '@/repositories/prisma/prisma-leads-repository'
import { GetLeadsArchivedService } from '@/services/leads/get-leads-archived-service'

export default function makeGetLeadsArchivedService() {
  return new GetLeadsArchivedService(new PrismaLeadsRepository())
}
