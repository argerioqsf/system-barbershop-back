import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { GetConsultantService } from '@/services/consultant/get-consultant-profile-service'

export function makeGetConsultantService() {
  return new GetConsultantService(new PrismaUsersRepository())
}
