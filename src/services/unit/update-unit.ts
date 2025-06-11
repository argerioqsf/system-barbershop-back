import { UnitRepository } from '@/repositories/unit-repository'
import { Unit } from '@prisma/client'

interface UpdateUnitRequest {
  id: string
  name: string
}

interface UpdateUnitResponse {
  unit: Unit
}

export class UpdateUnitService {
  constructor(private repository: UnitRepository) {}

  async execute(data: UpdateUnitRequest): Promise<UpdateUnitResponse> {
    const unit = await this.repository.update(data.id, { name: data.name })
    return { unit }
  }
}
