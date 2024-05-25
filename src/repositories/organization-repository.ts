import { Organization, Prisma } from '@prisma/client'

export interface OrganizationRepository {
  create(data: Prisma.OrganizationCreateInput): Promise<Organization>
}
