import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { CreateProfileService } from '@/services/profile/register-profile-service'

export function makeCreateProfileService() {
  return new CreateProfileService(
    new PrismaUsersRepository(),
    new PrismaProfilesRepository(),
  )
}
