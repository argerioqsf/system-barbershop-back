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
      categoryId: (data.category as { connect: { id: string } }).connect.id,
      defaultTime: (data.defaultTime as number | null) ?? null,
      commissionPercentage:
        (data.commissionPercentage as number | null) ?? null,
      unitId: (data.unit as { connect: { id: string } }).connect.id,
    }
    this.services.push(service)
    return service
  }

  async findManyByUnit(unitId: string): Promise<Service[]> {
    return this.services.filter((s) => s.unitId === unitId)
  }

  async findMany(where: Prisma.ServiceWhereInput = {}): Promise<Service[]> {
    return this.services.filter((s) => {
      if (where.unitId && s.unitId !== where.unitId) return false
      if (
        where.unit &&
        'organizationId' in (where.unit as { organizationId: string })
      ) {
        return (
          s.organizationId ===
          (where.unit as { organizationId: string }).organizationId
        )
      }
      return true
    })
  }

  async findById(id: string): Promise<Service | null> {
    return this.services.find((s) => s.id === id) ?? null
  }

  async findManyPaginated(
    where: Prisma.ServiceWhereInput,
    page: number,
    perPage: number,
  ): Promise<{ items: Service[]; count: number }> {
    const all = await this.findMany(where)
    const count = all.length
    const items = all.slice(
      (page - 1) * perPage,
      (page - 1) * perPage + perPage,
    )
    return { items, count }
  }

  async update(id: string, data: Prisma.ServiceUpdateInput): Promise<Service> {
    const index = this.services.findIndex((s) => s.id === id)
    if (index === -1) {
      throw new Error('Service not found')
    }
    const service = this.services[index]
    if (data.name) {
      service.name = data.name as string
    }
    if (data.description) {
      service.description = data.description as string
    }
    if (data.imageUrl) {
      service.imageUrl = data.imageUrl as string
    }
    if (data.cost) {
      service.cost = data.cost as number
    }
    if (data.price) {
      service.price = data.price as number
    }
    if (data.defaultTime) {
      service.defaultTime = data.defaultTime as number
    }
    if (data.commissionPercentage) {
      service.commissionPercentage = data.commissionPercentage as number
    }
    this.services[index] = service
    return service
  }
}
