import { Cycle, Prisma } from '@prisma/client'

export interface CycleRepository {
  create(organizationId: string): Promise<Cycle>
  update(id: string, data: Prisma.CycleUpdateInput): Promise<Cycle>
}
