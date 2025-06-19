import { UserToken } from '@/http/controllers/authenticate-controller'
import { ServiceRepository } from '@/repositories/service-repository'
import { assertUser } from '@/utils/assert-user'
import { assertPermission, getScope, buildUnitWhere } from '@/utils/permissions'
import { Service } from '@prisma/client'

interface ListServicesResponse {
  services: Service[]
}

export class ListServicesService {
  constructor(private repository: ServiceRepository) {}

  async execute(userToken: UserToken): Promise<ListServicesResponse> {
    assertUser(userToken)
    assertPermission(userToken.role, 'LIST_SERVICES')
    const scope = getScope(userToken)
    const where = buildUnitWhere(scope)
    const services = await this.repository.findMany(where)
    return { services }
  }
}
