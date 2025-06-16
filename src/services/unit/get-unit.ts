import { UnitRepository } from '@/repositories/unit-repository'
import { Unit } from '@prisma/client'

interface GetUnitResponse {
  unit: Unit | null
}

export class GetUnitService {
  constructor(private repository: UnitRepository) {}

  async execute(id: string): Promise<GetUnitResponse> {
    const unit = await this.repository.findById(id)
    return { unit }
  }
}
