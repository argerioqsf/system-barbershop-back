import { Prisma } from '@prisma/client'

export interface UnitConsultantRepository {
  createMany(
    unitsIds: string[],
    consultantId: string,
  ): Promise<Prisma.BatchPayload>
}
