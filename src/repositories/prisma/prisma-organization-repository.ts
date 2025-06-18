import { prisma } from '@/lib/prisma'
import { Prisma, Organization } from '@prisma/client'
import { OrganizationRepository } from '../organization-repository'

export class PrismaOrganizationRepository implements OrganizationRepository {
  async create(data: Prisma.OrganizationCreateInput): Promise<Organization> {
    return prisma.organization.create({ data })
  }

  async findById(id: string): Promise<Organization | null> {
    return prisma.organization.findUnique({ where: { id } })
  }

  async findMany(): Promise<Organization[]> {
    return prisma.organization.findMany()
  }

  async update(
    id: string,
    data: Prisma.OrganizationUpdateInput,
  ): Promise<Organization> {
    return prisma.organization.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await prisma.organization.delete({ where: { id } })
  }

  async incrementBalance(id: string, amount: number): Promise<Organization> {
    return await prisma.organization.update({
      where: { id },
      data: { totalBalance: { increment: amount } },
    })
  }
}
