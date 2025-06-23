import { ProfileBlockedHourRepository } from '@/repositories/profile-blocked-hour-repository'
import { ProfileWorkHourRepository } from '@/repositories/profile-work-hour-repository'
import { ProfileBlockedHour } from '@prisma/client'

interface AddProfileBlockedHourRequest {
  profileId: string
  dayHourId: string
}

interface AddProfileBlockedHourResponse {
  blocked: ProfileBlockedHour
}

export class AddProfileBlockedHourService {
  constructor(
    private blockedRepository: ProfileBlockedHourRepository,
    private workRepository: ProfileWorkHourRepository,
  ) {}

  async execute(
    data: AddProfileBlockedHourRequest,
  ): Promise<AddProfileBlockedHourResponse> {
    const works = await this.workRepository.findManyByProfile(data.profileId)
    const allowed = works.some((w) => w.dayHourId === data.dayHourId)
    if (!allowed) throw new Error('DayHour outside working hours')

    const blockedExisting = await this.blockedRepository.findManyByProfile(
      data.profileId,
    )
    const duplicate = blockedExisting.some(
      (b) => b.dayHourId === data.dayHourId,
    )
    if (duplicate) throw new Error('DayHour already blocked')

    const blocked = await this.blockedRepository.create({
      profileId: data.profileId,
      dayHourId: data.dayHourId,
    })
    return { blocked }
  }
}
