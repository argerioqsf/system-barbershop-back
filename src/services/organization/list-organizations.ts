import { UserToken } from '@/http/controllers/authenticate-controller'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { Organization } from '@prisma/client'

interface ListOrganizationsResponse {
  organizations: Organization[]
}

export class ListOrganizationsService {
  constructor(private repository: OrganizationRepository) {}

  async execute(userToken: UserToken): Promise<ListOrganizationsResponse> {
    if (!userToken.sub) throw new Error('User not found')
    let organizations: Organization[] = []
    if (userToken.role === 'ADMIN') {
      organizations = await this.repository.findMany()
    } else {
      const org: Organization | null = await this.repository.findById(
        userToken.organizationId,
      )
      if (!org) throw new Error('Organization not found')
      organizations = [org]
    }
    return { organizations }
  }
}
