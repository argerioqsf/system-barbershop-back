import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { GetIndicatorProfileService } from '@/services/indicator/get-indicators-profiles-service'

export function getIndicatorProfileService() {
  return new GetIndicatorProfileService(new PrismaUsersRepository())
}
