import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { UpdateServiceService } from '@/services/service/update-service'

export function makeUpdateService() {
  return new UpdateServiceService(new PrismaServiceRepository())
}
