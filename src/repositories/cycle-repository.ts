import { Cycle, Prisma } from '@prisma/client'

export interface CycleRepository {
  create(data: Prisma.CycleUncheckedCreateInput): Promise<Cycle>
}
