import { Prisma } from '@prisma/client'

export interface UnitConsultantRepository {
  createMany(
    consultantId: string,
    unitsIds?: string[],
  ): Promise<Prisma.BatchPayload>

  deleteMany(
    consultantId: string,
    unitsIds?: string[],
  ): Promise<Prisma.BatchPayload>
}
