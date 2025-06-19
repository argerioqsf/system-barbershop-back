import { UserToken } from '@/http/controllers/authenticate-controller'
import { UnitRepository } from '@/repositories/unit-repository'
import { assertUser } from '@/utils/assert-user'
import {
  assertPermission,
  getScope,
  listUnitsByScope,
} from '@/utils/permissions'
import { Unit } from '@prisma/client'

interface ListUnitsResponse {
  units: Unit[]
}

export class ListUnitsService {
  constructor(private repository: UnitRepository) {}

  async execute(userToken: UserToken): Promise<ListUnitsResponse> {
    assertUser(userToken)
    assertPermission(userToken.role, 'LIST_UNITS')
    const scope = getScope(userToken)
    const units = await listUnitsByScope(this.repository, scope)
    return { units }
  }
}
