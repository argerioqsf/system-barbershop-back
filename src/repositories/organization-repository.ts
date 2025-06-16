import { Prisma, Organization } from '@prisma/client'

export interface OrganizationRepository {
  create(data: Prisma.OrganizationCreateInput): Promise<Organization>
  findById(id: string): Promise<Organization | null>
  findMany(): Promise<Organization[]>
  update(
    id: string,
    data: Prisma.OrganizationUpdateInput,
  ): Promise<Organization>
  delete(id: string): Promise<void>
  incrementBalance(id: string, amount: number): Promise<void>
}
