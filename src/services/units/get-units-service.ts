import { UnitRepository } from '@/repositories/unit-repository'
import { Prisma, Unit } from '@prisma/client'

interface GetUnitsServiceRequest {
  name?: string
  page: number
}

interface GetUnitsServiceResponse {
  units: Unit[]
  count: number
}

export class GetUnitsService {
  constructor(private unitRepository: UnitRepository) {}

  async execute({
    page,
    name,
  }: GetUnitsServiceRequest): Promise<GetUnitsServiceResponse> {
    const where: Prisma.UnitWhereInput = {
      name: { contains: name },
    }
    const units = await this.unitRepository.findMany(page, where)
    const count = await this.unitRepository.count(where)

    return { units, count }
  }
}
