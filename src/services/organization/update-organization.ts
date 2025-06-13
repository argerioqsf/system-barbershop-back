import { OrganizationRepository } from '@/repositories/organization-repository'
import { Organization } from '@prisma/client'

interface UpdateOrganizationRequest {
  id: string
  name: string
  slug?: string
}

interface UpdateOrganizationResponse {
  organization: Organization
}

export class UpdateOrganizationService {
  constructor(private repository: OrganizationRepository) {}

  async execute(data: UpdateOrganizationRequest): Promise<UpdateOrganizationResponse> {
    const { id, name, slug } = data
    const organization = await this.repository.update(id, {
      name,
      ...(slug ? { slug } : {}),
    })
    return { organization }
  }
}
