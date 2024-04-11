import { UnitRepository } from '@/repositories/unit-repository'
import { Unit } from '@prisma/client'

interface GetUnitsServiceRequest {
  query?: string
  page: number
}

interface GetUnitsServiceResponse {
  units: Unit[]
}

export class GetUnitsService {
  constructor(private unitRepository: UnitRepository) {}

  async execute({
    page,
    query,
  }: GetUnitsServiceRequest): Promise<GetUnitsServiceResponse> {
    const units = await this.unitRepository.findMany(page, query)

    return { units }
  }
}
