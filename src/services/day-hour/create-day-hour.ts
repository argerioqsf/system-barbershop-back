import { DayHourRepository } from '@/repositories/day-hour-repository'
import { DayHour } from '@prisma/client'

interface CreateDayHourRequest {
  weekDay: number
  startHour: string
  endHour: string
}

interface CreateDayHourResponse {
  dayHour: DayHour
}

export class CreateDayHourService {
  constructor(private repository: DayHourRepository) {}

  async execute(data: CreateDayHourRequest): Promise<CreateDayHourResponse> {
    const regex = /^([01]\d|2[0-3]):[0-5]\d$/
    if (!regex.test(data.startHour) || !regex.test(data.endHour)) {
      throw new Error('Invalid time format')
    }
    const dayHour = await this.repository.create({
      weekDay: data.weekDay,
      startHour: data.startHour,
      endHour: data.endHour,
    })
    return { dayHour }
  }
}
