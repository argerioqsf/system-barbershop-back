import { UserToken } from '@/http/controllers/authenticate-controller'
import { UnitRepository } from '@/repositories/unit-repository'
import { assertUser } from '@/utils/assert-user'
import { hasPermission } from '@/utils/permissions'
import { Unit } from '@prisma/client'

interface ListUnitsResponse {
  units: Unit[]
}

export class ListUnitsService {
  constructor(private repository: UnitRepository) {}

  async execute(userToken: UserToken): Promise<ListUnitsResponse> {
    assertUser(userToken)

    let units: Unit[] = []

    if (await hasPermission(userToken.sub, 'LIST_ALL_UNITS')) {
      units = await this.repository.findMany()
    } else if (await hasPermission(userToken.sub, 'LIST_ORG_UNIT')) {
      units = await this.repository.findMany({
        organizationId: userToken.organizationId,
      })
    }

    return { units }
  }
}
