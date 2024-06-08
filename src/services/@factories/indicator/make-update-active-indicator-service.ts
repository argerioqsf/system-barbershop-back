import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { UpdateActiveIndicatorService } from '@/services/indicator/update-active-indicator-service'

export function makeUpdateActiveIndicatorService() {
  return new UpdateActiveIndicatorService(new PrismaUsersRepository())
}
