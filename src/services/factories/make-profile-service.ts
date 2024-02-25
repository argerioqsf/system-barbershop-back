import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { GetUserProfileService } from '../get-user-profile-service'

export function makeProfileService() {
  const prismaUserRepository = new PrismaUsersRepository()
  const profileService = new GetUserProfileService(prismaUserRepository)

  return profileService
}
