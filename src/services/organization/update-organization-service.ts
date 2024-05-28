import { OrganizationRepository } from '@/repositories/organization-repository'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { Organization } from '@prisma/client'
import { UserTypeNotCompatible } from '../@errors/user-type-not-compatible'

interface UpdateOrganizationServiceRequest {
  id: string
  userId: string
  name: string
  consultant_bonus: number
  indicator_bonus: number
  slug: string
}

interface UpdateOrganizationServiceResponse {
  organization: Organization
}

export class UpdateOrganizationService {
  constructor(
    private organizationRepository: OrganizationRepository,
    private profileRepository: ProfilesRepository,
  ) {}

  async execute({
    id,
    userId,
    name,
    consultant_bonus,
    indicator_bonus,
    slug,
  }: UpdateOrganizationServiceRequest): Promise<UpdateOrganizationServiceResponse> {
    const profile = await this.profileRepository.findByUserId(userId)

    if (profile?.role !== 'administrator') {
      throw new UserTypeNotCompatible()
    }

    const organization = await this.organizationRepository.update(id, {
      name,
      consultant_bonus,
      indicator_bonus,
      slug,
    })

    return {
      organization,
    }
  }
}
