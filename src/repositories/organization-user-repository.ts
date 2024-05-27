import { Prisma } from '@prisma/client'

export interface OrganizationUserRepository {
  createMany(
    userId: string,
    organizationId: string,
  ): Promise<Prisma.BatchPayload>
}
