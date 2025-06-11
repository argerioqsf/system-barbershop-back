import { OrganizationRepository } from '@/repositories/organization-repository'
import { Organization } from '@prisma/client'

interface ListOrganizationsResponse {
  organizations: Organization[]
}

export class ListOrganizationsService {
  constructor(private repository: OrganizationRepository) {}

  async execute(): Promise<ListOrganizationsResponse> {
    const organizations = await this.repository.findMany()
    return { organizations }
  }
}
