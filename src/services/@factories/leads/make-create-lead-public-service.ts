import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'
import { PrismaLeadsRepository } from '@/repositories/prisma/prisma-leads-repository'
import { PrismaSegmentsRepository } from '@/repositories/prisma/prisma-segments-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { CreateLeadPublicService } from '@/services/leads/create-lead-publico-service'

export default function makeCreateLeadPublicService() {
  return new CreateLeadPublicService(
    new PrismaLeadsRepository(),
    new PrismaUnitRepository(),
    new PrismaCoursesRepository(),
    new PrismaSegmentsRepository(),
  )
}
