import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { RegisterUserProfileService } from '@/services/users/register-user-profile-service'

export function makeUserProfileService() {
  return new RegisterUserProfileService(
    new PrismaUsersRepository(),
    new PrismaProfilesRepository(),
  )
}
