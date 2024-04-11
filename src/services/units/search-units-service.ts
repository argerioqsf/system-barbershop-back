import { UnitRepository } from '@/repositories/unit-repository'
import { Unit } from '@prisma/client'

interface SearchUnitServiceRequest {
  query: string
  page: number
}

interface SearchUnitServiceResponse {
  units: Unit[]
}

export class SearchUnitService {
  constructor(private unitRepository: UnitRepository) {}

  async execute({
    query,
    page,
  }: SearchUnitServiceRequest): Promise<SearchUnitServiceResponse> {
    const units = await this.unitRepository.searchMany(query, page)

    return { units }
  }
}
