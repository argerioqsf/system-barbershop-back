import { OrganizationRepository } from '@/repositories/organization-repository'
import { Organization } from '@prisma/client'

interface CreateOrganizationServiceRequest {
  name: string
  consultant_bonus: number
  indicator_bonus: number
}

interface CreateOrganizationServiceResponse {
  organization: Organization
}

export class CreateOrganizationService {
  constructor(private organizationRepository: OrganizationRepository) {}

  async execute({
    name,
    consultant_bonus,
    indicator_bonus,
  }: CreateOrganizationServiceRequest): Promise<CreateOrganizationServiceResponse> {
    const organization = await this.organizationRepository.create({
      name,
      consultant_bonus,
      indicator_bonus,
    })

    return { organization }
  }
}
