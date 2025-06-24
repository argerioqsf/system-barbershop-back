import { DayHourRepository } from '@/repositories/day-hour-repository'
import { DayHour } from '@prisma/client'

interface CreateDayHourRequest {
  weekDay: number
  startHour: Date
  endHour: Date
}

interface CreateDayHourResponse {
  dayHour: DayHour
}

export class CreateDayHourService {
  constructor(private repository: DayHourRepository) {}

  async execute(data: CreateDayHourRequest): Promise<CreateDayHourResponse> {
    const dayHour = await this.repository.create({
      weekDay: data.weekDay,
      startHour: data.startHour,
      endHour: data.endHour,
    })
    return { dayHour }
  }
}
