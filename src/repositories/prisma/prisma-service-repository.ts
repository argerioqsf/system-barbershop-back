import { prisma } from '@/lib/prisma'
import { Prisma, Service } from '@prisma/client'
import { ServiceRepository } from '../service-repository'

export class PrismaServiceRepository implements ServiceRepository {
  async create(data: Prisma.ServiceCreateInput): Promise<Service> {
    const service = await prisma.service.create({ data })
    return service
  }

  async findManyByUnit(unitId: string): Promise<Service[]> {
    return prisma.service.findMany({ where: { unitId } })
  }

  async findMany(where: Prisma.ServiceWhereInput = {}): Promise<Service[]> {
    return prisma.service.findMany({ where })
  }

  async findById(id: string): Promise<Service | null> {
    const service = await prisma.service.findUnique({ where: { id } })
    return service
  }
}
