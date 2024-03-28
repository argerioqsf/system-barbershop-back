import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { RegisterUserProfileService } from '../register-user-profile-service'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'

export function makeUserProfileService() {
  return new RegisterUserProfileService(
    new PrismaUsersRepository(),
    new PrismaProfilesRepository(),
  )
}
