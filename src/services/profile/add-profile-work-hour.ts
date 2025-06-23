import { ProfileWorkHourRepository } from '@/repositories/profile-work-hour-repository'
import { ProfileWorkHour } from '@prisma/client'

interface AddProfileWorkHourRequest {
  profileId: string
  dayHourId: string
}

interface AddProfileWorkHourResponse {
  workHour: ProfileWorkHour
}

export class AddProfileWorkHourService {
  constructor(private repository: ProfileWorkHourRepository) {}

  async execute(
    data: AddProfileWorkHourRequest,
  ): Promise<AddProfileWorkHourResponse> {
    const workHour = await this.repository.create({
      profileId: data.profileId,
      dayHourId: data.dayHourId,
    })
    return { workHour }
  }
}
