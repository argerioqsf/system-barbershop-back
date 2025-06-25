import { UnitOpeningHourRepository } from '@/repositories/unit-opening-hour-repository'
import { UnitOpeningHour } from '@prisma/client'

interface ListUnitOpeningHoursRequest {
  unitId: string
}

interface ListUnitOpeningHoursResponse {
  openingHours: UnitOpeningHour[]
}

export class ListUnitOpeningHoursService {
  constructor(private repository: UnitOpeningHourRepository) {}

  async execute({
    unitId,
  }: ListUnitOpeningHoursRequest): Promise<ListUnitOpeningHoursResponse> {
    const openingHours = await this.repository.findManyByUnit(unitId)
    return { openingHours }
  }
}
