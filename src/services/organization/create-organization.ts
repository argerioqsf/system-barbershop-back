import { OrganizationRepository } from '@/repositories/organization-repository'
import { Organization } from '@prisma/client'

interface CreateOrganizationRequest {
  name: string
  slug: string
}

interface CreateOrganizationResponse {
  organization: Organization
}

export class CreateOrganizationService {
  constructor(private repository: OrganizationRepository) {}

  async execute(
    data: CreateOrganizationRequest,
  ): Promise<CreateOrganizationResponse> {
    const organization = await this.repository.create({
      name: data.name,
      slug: data.slug,
    })
    return { organization }
  }
}
