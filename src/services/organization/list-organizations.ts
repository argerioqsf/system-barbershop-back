import { UserToken } from '@/http/controllers/authenticate-controller'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { assertUser } from '@/utils/assert-user'
import { OrganizationNotFoundError } from '@/services/@errors/organization/organization-not-found-error'
import { Organization } from '@prisma/client'

interface ListOrganizationsResponse {
  organizations: Organization[]
}

export class ListOrganizationsService {
  constructor(private repository: OrganizationRepository) {}

  async execute(userToken: UserToken): Promise<ListOrganizationsResponse> {
    assertUser(userToken)
    let organizations: Organization[] = []
    if (userToken.role === 'ADMIN') {
      organizations = await this.repository.findMany()
    } else {
      const org: Organization | null = await this.repository.findById(
        userToken.organizationId,
      )
      if (!org) throw new OrganizationNotFoundError()
      organizations = [org]
    }
    return { organizations }
  }
}
