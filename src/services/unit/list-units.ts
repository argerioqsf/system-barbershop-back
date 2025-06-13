import { UserToken } from '@/http/controllers/authenticate-controller'
import { UnitRepository } from '@/repositories/unit-repository'
import { Unit } from '@prisma/client'

interface ListUnitsResponse {
  units: Unit[]
}

export class ListUnitsService {
  constructor(private repository: UnitRepository) {}

  async execute(userToken: UserToken): Promise<ListUnitsResponse> {
    if (!userToken.sub) throw new Error('User not found')
    let units = []
    if (userToken.role === 'ADMIN') {
      units = await this.repository.findMany()
    } else {
      units = await this.repository.findManyByOrganization(
        userToken.organizationId,
      )
    }
    return { units }
  }
}
