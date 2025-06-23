import { UnitDayHourRepository } from '@/repositories/unit-day-hour-repository'
import { UnitDayHour } from '@prisma/client'

interface AddUnitDayHourRequest {
  unitId: string
  dayHourId: string
}

interface AddUnitDayHourResponse {
  unitDayHour: UnitDayHour
}

export class AddUnitDayHourService {
  constructor(private repository: UnitDayHourRepository) {}

  async execute(data: AddUnitDayHourRequest): Promise<AddUnitDayHourResponse> {
    const unitDayHour = await this.repository.create({
      unitId: data.unitId,
      dayHourId: data.dayHourId,
    })
    return { unitDayHour }
  }
}
