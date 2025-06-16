import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { ListServicesService } from '@/services/service/list-services'

export function makeListServices() {
  const repository = new PrismaServiceRepository()
  const service = new ListServicesService(repository)
  return service
}
