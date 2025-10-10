import { PrismaServiceRepository } from '@/repositories/prisma/prisma-service-repository'
import { GetServiceService } from '@/services/service/get-service'

export function makeGetService() {
  return new GetServiceService(new PrismaServiceRepository())
}
