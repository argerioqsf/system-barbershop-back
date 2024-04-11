import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { GetIndicatorService } from '@/services/indicator/get-indicator-profile-service'

export function makeGetIndicatorService() {
  return new GetIndicatorService(new PrismaUsersRepository())
}
