import { Cycle, Prisma } from '@prisma/client'
import { CycleRepository } from '../cycle-repository'
import { prisma } from '@/lib/prisma'

export class PrismaCycleRepository implements CycleRepository {
  create(data: Prisma.CycleUncheckedCreateInput): Promise<Cycle> {
    const cycle = prisma.cycle.create({ data })

    return cycle
  }
}
