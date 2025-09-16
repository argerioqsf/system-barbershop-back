import { ProfileWorkHourRepository } from '@/repositories/profile-work-hour-repository'
import { ProfileBlockedHourRepository } from '@/repositories/profile-blocked-hour-repository'
import { timeToMinutes } from '@/utils/time'

interface DeleteProfileWorkHourRequest {
  id: string
}

export class DeleteProfileWorkHourService {
  constructor(
    private workHourRepository: ProfileWorkHourRepository,
    private blockedHourRepository?: ProfileBlockedHourRepository,
  ) {}

  async execute({ id }: DeleteProfileWorkHourRequest): Promise<void> {
    const workHour = await this.workHourRepository.findById(id)
    if (!workHour) {
      // If not found, nothing to do
      return
    }

    const blocked = this.blockedHourRepository
      ? await this.blockedHourRepository.findManyByProfile(workHour.profileId)
      : []

    const weekDay = workHour.weekDay
    const wStart = timeToMinutes(workHour.startHour)
    const wEnd = timeToMinutes(workHour.endHour)

    const toDelete = blocked.filter((b) => {
      const bWeekDay = b.startHour.getDay()
      if (bWeekDay !== weekDay) return false
      const bStart = timeToMinutes(b.startHour)
      const bEnd = timeToMinutes(b.endHour)
      return bStart >= wStart && bEnd <= wEnd
    })

    if (this.blockedHourRepository) {
      for (const b of toDelete) {
        await this.blockedHourRepository.delete(b.id)
      }
    }

    await this.workHourRepository.delete(id)
  }
}
