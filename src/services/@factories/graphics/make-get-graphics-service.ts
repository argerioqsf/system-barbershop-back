import { PrismaCoursesRepository } from '@/repositories/prisma/prisma-courses-repository'
import { PrismaCycleRepository } from '@/repositories/prisma/prisma-cycle-repository'
import { PrismaExtractProfileRepository } from '@/repositories/prisma/prisma-extract-profile-repository'
import { PrismaLeadsRepository } from '@/repositories/prisma/prisma-leads-repository'
import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { GetGraphicService } from '@/services/graphics/get-graphics-service'

export function makeGetGraphicsService() {
  return new GetGraphicService(
    new PrismaLeadsRepository(),
    new PrismaUsersRepository(),
    new PrismaCycleRepository(),
    new PrismaExtractProfileRepository(),
    new PrismaProfilesRepository(),
    new PrismaCoursesRepository(),
  )
}
