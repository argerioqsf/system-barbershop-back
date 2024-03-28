import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profile-repository'
import { GetUserProfileFromUserIdService } from '../get-profile-from-userId-service'

export function getProfileFromUserIdService() {
  return new GetUserProfileFromUserIdService(new PrismaProfilesRepository())
}
