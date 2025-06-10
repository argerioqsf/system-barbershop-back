import { Prisma, Service } from '@prisma/client'

export interface ServiceRepository {
  create(data: Prisma.ServiceCreateInput): Promise<Service>
  findMany(): Promise<Service[]>
  findById(id: string): Promise<Service | null>
}
