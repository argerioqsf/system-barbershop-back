import { Prisma, Unit } from '@prisma/client'

export interface UnitRepository {
  create(data: Prisma.UnitCreateInput): Promise<Unit>
  findById(id: string): Promise<Unit | null>
  findManyByOrganization(organizationId: string): Promise<Unit[]>
  findMany(): Promise<Unit[]>
  update(id: string, data: Prisma.UnitUpdateInput): Promise<Unit>
  delete(id: string): Promise<void>
  incrementBalance(id: string, amount: number): Promise<void>
}
