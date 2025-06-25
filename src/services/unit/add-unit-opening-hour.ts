import { UnitOpeningHourRepository } from '@/repositories/unit-opening-hour-repository'
import { UnitOpeningHour } from '@prisma/client'
interface AddUnitOpeningHourRequest {
  unitId: string
  weekDay: number
  startHour: string
  endHour: string
}

interface AddUnitOpeningHourResponse {
  openingHour: UnitOpeningHour
}

export class AddUnitOpeningHourService {
  constructor(private repository: UnitOpeningHourRepository) {}

  async execute(
    data: AddUnitOpeningHourRequest,
  ): Promise<AddUnitOpeningHourResponse> {
    const openingHour = await this.repository.create({
      unitId: data.unitId,
      weekDay: data.weekDay,
      startHour: data.startHour,
      endHour: data.endHour,
    })
    return { openingHour }
  }
}
