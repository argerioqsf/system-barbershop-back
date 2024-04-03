import { Prisma, Unit } from '@prisma/client'

export interface UnitRepository {
  create(data: Prisma.UnitCreateInput): Promise<Unit>
  findMany(): Promise<Unit[]>
  findById(id: string): Promise<Unit | null>
}
