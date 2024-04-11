import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { RegisterIndicatorProfileService } from '@/services/indicator/create-public-indicator-service'

export function makeRegisterIndicatorProfileService() {
  return new RegisterIndicatorProfileService(
    new PrismaUsersRepository(),
    new PrismaProfilesRepository(),
  )
}
