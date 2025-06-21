import { UserToken } from '@/http/controllers/authenticate-controller'
import { UnitRepository } from '@/repositories/unit-repository'
import { assertUser } from '@/utils/assert-user'
import { hasPermission } from '@/utils/permissions'
import { Unit } from '@prisma/client'
import { UnauthorizedError } from '../@errors/auth/unauthorized-error'

interface ListUnitsResponse {
  units: Unit[]
}

export class ListUnitsService {
  constructor(private repository: UnitRepository) {}

  async execute(userToken: UserToken): Promise<ListUnitsResponse> {
    assertUser(userToken)

    let units: Unit[] = []
    if (hasPermission(['LIST_UNIT_ALL'], userToken.permissions)) {
      units = await this.repository.findMany()
    } else if (hasPermission(['LIST_UNIT_ORG'], userToken.permissions)) {
      units = await this.repository.findMany({
        organizationId: userToken.organizationId,
      })
    } else {
      throw new UnauthorizedError()
    }

    return { units }
  }
}
