import { UnitRepository } from '@/repositories/unit-repository'
import { Unit } from '@prisma/client'

interface ListUnitsResponse {
  units: Unit[]
}

export class ListUnitsService {
  constructor(private repository: UnitRepository) {}

  async execute(organizationId: string): Promise<ListUnitsResponse> {
    const units = await this.repository.findManyByOrganization(organizationId)
    return { units }
  }
}
