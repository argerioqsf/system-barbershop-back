import { Prisma, Organization } from '@prisma/client'
import { OrganizationRepository } from '../organization-repository'
import { randomUUID } from 'crypto'

export class InMemoryOrganizationRepository implements OrganizationRepository {
  constructor(
    public organization: Organization,
    public organizations: Organization[] = [organization],
  ) {}

  async create(data: Prisma.OrganizationCreateInput): Promise<Organization> {
    const org: Organization = {
      id: randomUUID(),
      name: data.name,
      slug: data.slug,
      totalBalance: 0,
      createdAt: new Date(),
    }
    this.organizations.push(org)
    return org
  }

  async findById(id: string): Promise<Organization | null> {
    return this.organizations.find((o) => o.id === id) ?? null
  }

  async findMany(): Promise<Organization[]> {
    return this.organizations
  }

  async update(
    id: string,
    data: Prisma.OrganizationUpdateInput,
  ): Promise<Organization> {
    const org = this.organizations.find((o) => o.id === id)
    if (!org) throw new Error('Organization not found')
    if (data.name) org.name = data.name as string
    if (data.slug) org.slug = data.slug as string
    return org
  }

  async delete(id: string): Promise<void> {
    this.organizations = this.organizations.filter((o) => o.id !== id)
  }

  async incrementBalance(id: string, amount: number): Promise<Organization> {
    const org = this.organizations.find((o) => o.id === id)
    if (!org) throw new Error('Organization not found')
    org.totalBalance += amount
    if (this.organization.id === id && org !== this.organization) {
      this.organization.totalBalance += amount
    }
    return org
  }
}
