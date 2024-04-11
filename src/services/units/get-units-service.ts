import { UnitRepository } from '@/repositories/unit-repository'
import { Unit } from '@prisma/client'

interface GetUnitsServiceRequest {
  page: number
}

interface GetUnitsServiceResponse {
  units: Unit[]
}

export class GetUnitsService {
  constructor(private unitRepository: UnitRepository) {}

  async execute({
    page,
  }: GetUnitsServiceRequest): Promise<GetUnitsServiceResponse> {
    const units = await this.unitRepository.findMany(page)

    return { units }
  }
}
