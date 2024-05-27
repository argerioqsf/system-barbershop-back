import { Organization, Prisma } from '@prisma/client'

export interface OrganizationRepository {
  update(
    id: string,
    data: Prisma.OrganizationUpdateInput,
  ): Promise<Organization>
}
