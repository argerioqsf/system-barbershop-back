import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'
import { PrismaLeadsRepository } from '@/repositories/prisma/prisma-leads-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaSegmentsRepository } from '@/repositories/prisma/prisma-segments-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { UpdateLeadService } from '@/services/leads/update-lead-service'

export default function makeUpdateLeadService() {
  return new UpdateLeadService(
    new PrismaLeadsRepository(),
    new PrismaProfilesRepository(),
    new PrismaUnitRepository(),
    new PrismaCoursesRepository(),
    new PrismaSegmentsRepository(),
  )
}
