import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { MountSelectIndicatorService } from '@/services/indicator/mount-select-indicator-service'

export function getMountSelectIndicatorProfileService() {
  return new MountSelectIndicatorService(new PrismaUsersRepository())
}
