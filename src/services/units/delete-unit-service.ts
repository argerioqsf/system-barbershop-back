import { UnitRepository } from '@/repositories/unit-repository'
import { Unit } from '@prisma/client'
import { UnitNotFoundError } from '../@errors/unit-not-found-error'

interface DeleteUnitServiceRequest {
  id: string
}

interface DeleteUnitServiceResponse {
  unit: Unit
}

export class DeleteUnitService {
  constructor(private unitRepository: UnitRepository) {}

  async execute({
    id,
  }: DeleteUnitServiceRequest): Promise<DeleteUnitServiceResponse> {
    const unit = await this.unitRepository.deleteById(id)

    if (!unit) throw new UnitNotFoundError()

    return { unit }
  }
}
