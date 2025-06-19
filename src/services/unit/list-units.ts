import { UserToken } from '@/http/controllers/authenticate-controller'
import { UnitRepository } from '@/repositories/unit-repository'
import { assertUser } from '@/utils/assert-user'
import { Unit } from '@prisma/client'

interface ListUnitsResponse {
  units: Unit[]
}

export class ListUnitsService {
  constructor(private repository: UnitRepository) {}

  async execute(userToken: UserToken): Promise<ListUnitsResponse> {
    assertUser(userToken)
    let units: Unit[] = []
    if (userToken.role === 'ADMIN') {
      units = await this.repository.findMany()
    } else if (userToken.role === 'OWNER') {
      units = await this.repository.findManyByOrganization(
        userToken.organizationId,
      )
    } else {
      const unit = await this.repository.findById(userToken.unitId)
      units = unit ? [unit] : []
    }
    return { units }
  }
}
