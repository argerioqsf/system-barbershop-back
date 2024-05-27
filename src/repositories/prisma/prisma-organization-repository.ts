import { Prisma } from '@prisma/client'
import { OrganizationRepository } from '../organization-repository'
import { prisma } from '@/lib/prisma'

export class PrismaOrganizationRepository implements OrganizationRepository {
  update(
    id: string,
    data: Prisma.OrganizationUpdateInput,
  ): Promise<{
    id: string
    name: string
    consultant_bonus: number
    indicator_bonus: number
    slugs: string
  }> {
    const organization = prisma.organization.update({
      where: { id },
      data,
    })

    return organization
  }
}
