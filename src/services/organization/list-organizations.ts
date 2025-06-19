import { UserToken } from '@/http/controllers/authenticate-controller'
import { OrganizationRepository } from '@/repositories/organization-repository'
import { assertUser } from '@/utils/assert-user'
import { assertPermission, getScope } from '@/utils/permissions'
import { OrganizationNotFoundError } from '@/services/@errors/organization/organization-not-found-error'
import { Organization } from '@prisma/client'

interface ListOrganizationsResponse {
  organizations: Organization[]
}

export class ListOrganizationsService {
  constructor(private repository: OrganizationRepository) {}

  async execute(userToken: UserToken): Promise<ListOrganizationsResponse> {
    assertUser(userToken)
    assertPermission(userToken.role, 'LIST_ORGANIZATIONS')
    const scope = getScope(userToken)
    let organizations: Organization[] = []
    if (scope.organizationId || scope.unitId) {
      const org = await this.repository.findById(userToken.organizationId)
      if (!org) throw new OrganizationNotFoundError()
      organizations = [org]
    } else {
      organizations = await this.repository.findMany()
    }
    return { organizations }
  }
}
