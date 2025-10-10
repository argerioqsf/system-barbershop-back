import { Prisma, Service } from '@prisma/client'

export interface ServiceRepository {
  create(data: Prisma.ServiceCreateInput): Promise<Service>
  findManyByUnit(unitId: string): Promise<Service[]>
  findMany(where?: Prisma.ServiceWhereInput): Promise<Service[]>
  findById(id: string): Promise<Service | null>
  findManyPaginated(
    where: Prisma.ServiceWhereInput,
    page: number,
    perPage: number,
  ): Promise<{ items: Service[]; count: number }>
  update(id: string, data: Prisma.ServiceUpdateInput): Promise<Service>
}
