import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { CreateServiceService } from '@/services/service/create-service'

export function makeCreateService() {
  const repository = new PrismaServiceRepository()
  const service = new CreateServiceService(repository)
  return service
}
