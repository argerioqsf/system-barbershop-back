import { CoursesRepository } from '@/repositories/course-repository'
import { UnitRepository } from '@/repositories/unit-repository'
import { Unit } from '@prisma/client'

interface GetUnitsServiceResponse {
  units: Unit[]
}

export class GetUnitsService {
  constructor(
    private unitRepository: UnitRepository,
  ) {}

  async execute(): Promise<GetUnitsServiceResponse> {
    const units = await this.unitRepository.findMany()

    return { units }
  }
}
