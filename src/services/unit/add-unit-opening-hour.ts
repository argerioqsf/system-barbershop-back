import { UnitOpeningHourRepository } from '@/repositories/unit-opening-hour-repository'
import { subtractIntervals, timeToMinutes } from '@/utils/time'
import { UnitOpeningHour } from '@prisma/client'
import { TimeIntervalOverlapsError } from '../@errors/profile/time-interval-overlaps-error'
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
    const unitOpeningHours = await this.repository.findManyByUnit(
      data.unitId,
      data.weekDay,
    )

    const currentMap = unitOpeningHours.map((dh) => ({
      start: timeToMinutes(dh.startHour),
      end: timeToMinutes(dh.endHour),
    }))

    const openHourAvaiable = {
      start: timeToMinutes(data.startHour),
      end: timeToMinutes(data.endHour),
    }

    const verifyOverlay = subtractIntervals([openHourAvaiable], currentMap)
    if (
      verifyOverlay.length === 0 ||
      verifyOverlay[0].start !== openHourAvaiable.start ||
      verifyOverlay[0].end !== openHourAvaiable.end
    )
      throw new TimeIntervalOverlapsError()

    const openingHour = await this.repository.create({
      unitId: data.unitId,
      weekDay: data.weekDay,
      startHour: data.startHour,
      endHour: data.endHour,
    })
    return { openingHour }
  }
}
