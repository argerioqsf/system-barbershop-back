import { OrganizationRepository } from '@/repositories/organization-repository'
import { Organization, Prisma } from '@prisma/client'

interface CreateOrganizationRequest {
  name: string
}

interface CreateOrganizationResponse {
  organization: Organization
}

export class CreateOrganizationService {
  constructor(private repository: OrganizationRepository) {}

  async execute(
    data: CreateOrganizationRequest,
  ): Promise<CreateOrganizationResponse> {
    const organization = await this.repository.create({ name: data.name })
    return { organization }
  }
}
