import { OrganizationRepository } from '@/repositories/organization-repository'
import { Organization } from '@prisma/client'

interface GetOrganizationResponse {
  organization: Organization | null
}

export class GetOrganizationService {
  constructor(private repository: OrganizationRepository) {}

  async execute(id: string): Promise<GetOrganizationResponse> {
    const organization = await this.repository.findById(id)
    return { organization }
  }
}
