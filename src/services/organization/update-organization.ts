import { OrganizationRepository } from '@/repositories/organization-repository'
import { Organization } from '@prisma/client'

interface UpdateOrganizationRequest {
  id: string
  name: string
}

interface UpdateOrganizationResponse {
  organization: Organization
}

export class UpdateOrganizationService {
  constructor(private repository: OrganizationRepository) {}

  async execute(
    data: UpdateOrganizationRequest,
  ): Promise<UpdateOrganizationResponse> {
    const organization = await this.repository.update(data.id, { name: data.name })
    return { organization }
  }
}
