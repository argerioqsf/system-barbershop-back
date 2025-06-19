import { Prisma, Service } from '@prisma/client'
import { ServiceRepository } from '../service-repository'
import { randomUUID } from 'crypto'

export class InMemoryServiceRepository implements ServiceRepository {
  constructor(
    public services: (Service & { organizationId?: string })[] = [],
  ) {}

  async create(data: Prisma.ServiceCreateInput): Promise<Service> {
    const service: Service = {
      id: randomUUID(),
      name: data.name,
      description: (data.description as string | null) ?? null,
      imageUrl: (data.imageUrl as string | null) ?? null,
      cost: data.cost as number,
      price: data.price as number,
      unitId: (data.unit as any).connect.id,
    }
    this.services.push(service)
    return service
  }

  async findManyByUnit(unitId: string): Promise<Service[]> {
    return this.services.filter((s) => s.unitId === unitId)
  }

  async findMany(where: Prisma.ServiceWhereInput = {}): Promise<Service[]> {
    return this.services.filter((s: any) => {
      if (where.unitId && s.unitId !== where.unitId) return false
      if (where.unit && 'organizationId' in (where.unit as any)) {
        return s.organizationId === (where.unit as any).organizationId
      }
      return true
    })
  }

  async findById(id: string): Promise<Service | null> {
    return this.services.find((s) => s.id === id) ?? null
  }
}
