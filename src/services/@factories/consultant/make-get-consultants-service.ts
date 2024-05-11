import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { GetConsultantProfileService } from '@/services/consultant/get-consultants-profile-service'

export function getConsultantProfileService() {
  return new GetConsultantProfileService(new PrismaUsersRepository())
}
