import { prisma } from '@/lib/prisma'
import { Prisma, Service } from '@prisma/client'
import { ServiceRepository } from '../service-repository'

export class PrismaServiceRepository implements ServiceRepository {
  async create(data: Prisma.ServiceCreateInput): Promise<Service> {
    const service = await prisma.service.create({ data })
    return service
  }

  async findMany(): Promise<Service[]> {
    const services = await prisma.service.findMany()
    return services
  }

  async findById(id: string): Promise<Service | null> {
    const service = await prisma.service.findUnique({ where: { id } })
    return service
  }
}
