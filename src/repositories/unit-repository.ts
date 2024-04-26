import { Prisma, Unit } from '@prisma/client'

export interface UnitRepository {
  create(data: Prisma.UnitCreateInput): Promise<Unit>
  findMany(page: number, query?: string): Promise<Unit[]>
  count(query?: string): Promise<number>
  findById(id: string): Promise<Unit | null>
}
