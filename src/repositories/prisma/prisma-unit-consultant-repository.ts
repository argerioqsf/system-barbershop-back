import { Prisma } from '@prisma/client'
import { UnitConsultantRepository } from '../unit-consultant-repository'
import { prisma } from '@/lib/prisma'

export class PrismaUnitConsultantRepository
  implements UnitConsultantRepository
{
  async createMany(
    unitsIds: string[],
    consultantId: string,
  ): Promise<Prisma.BatchPayload> {
    const unitConsultant = await prisma.unitConsultant.createMany({
      data: unitsIds
        ? unitsIds.map((unitId: string) => ({
            consultantId,
            unitId,
          }))
        : [],
    })

    return unitConsultant
  }
}
