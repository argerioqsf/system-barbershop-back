import { Prisma, Unit } from '@prisma/client'

export interface UnitRepository {
  create(data: Prisma.UnitCreateInput): Promise<Unit>
  searchMany(query: string, page: number): Promise<Unit[]>
  findMany(page: number): Promise<Unit[]>
  findById(id: string): Promise<Unit | null>
}
