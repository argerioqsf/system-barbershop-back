import { UnitRepository } from '@/repositories/unit-repository'
import { Unit } from '@prisma/client'
import { UnitNotFoundError } from '../@errors/unit-not-found-error'

interface MountSelectUnitsResponse {
  units: Unit[]
}

export class MountSelectUnitsService {
  constructor(private unitsRepository: UnitRepository) {}

  async execute(): Promise<MountSelectUnitsResponse> {
    const units = await this.unitsRepository.mountSelect()

    if (!units) {
      throw new UnitNotFoundError()
    }

    return { units }
  }
}
