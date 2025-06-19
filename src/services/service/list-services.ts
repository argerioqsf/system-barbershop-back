import { UserToken } from '@/http/controllers/authenticate-controller'
import { ServiceRepository } from '@/repositories/service-repository'
import { assertUser } from '@/utils/assert-user'
import { Service } from '@prisma/client'

interface ListServicesResponse {
  services: Service[]
}

export class ListServicesService {
  constructor(private repository: ServiceRepository) {}

  async execute(userToken: UserToken): Promise<ListServicesResponse> {
    assertUser(userToken)

    let services = []

    if (userToken.role === 'OWNER') {
      services = await this.repository.findMany({
        unit: { organizationId: userToken.organizationId },
      })
    } else if (userToken.role === 'ADMIN') {
      services = await this.repository.findMany()
    } else {
      services = await this.repository.findManyByUnit(userToken.unitId)
    }
    return { services }
  }
}
