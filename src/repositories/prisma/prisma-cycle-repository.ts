import { prisma } from '@/lib/prisma'
import { Cycle, Prisma } from '@prisma/client'
import { CycleRepository } from '../cycle-repository'

export class PrismaCycleRepository implements CycleRepository {
  update(id: string, data: Prisma.CycleUpdateInput): Promise<Cycle> {
    const cycle = prisma.cycle.update({
      where: {
        id,
      },
      data,
    })

    return cycle
  }

  create(organizationId: string): Promise<Cycle> {
    const cycle = prisma.cycle.create({ data: { organizationId } })

    return cycle
  }
}
