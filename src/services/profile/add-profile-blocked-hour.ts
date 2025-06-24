import { ProfileBlockedHourRepository } from '@/repositories/profile-blocked-hour-repository'
import { ProfileWorkHourRepository } from '@/repositories/profile-work-hour-repository'
import { DayHourRepository } from '@/repositories/day-hour-repository'
import { ProfileBlockedHour, PermissionName } from '@prisma/client'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { assertPermission } from '@/utils/permissions'
import { PermissionDeniedError } from '../@errors/permission/permission-denied-error'
import { timeToMinutes, intervalsOverlap } from '@/utils/time'

interface AddProfileBlockedHourRequest {
  profileId: string
  startHour: Date
  endHour: Date
}

interface AddProfileBlockedHourResponse {
  blocked: ProfileBlockedHour
}

export class AddProfileBlockedHourService {
  constructor(
    private blockedRepository: ProfileBlockedHourRepository,
    private workRepository: ProfileWorkHourRepository,
    private dayHourRepository: DayHourRepository,
  ) {}

  async execute(
    user: UserToken,
    data: AddProfileBlockedHourRequest,
  ): Promise<AddProfileBlockedHourResponse> {
    await assertPermission(
      [PermissionName.MANAGE_SELF_BLOCKED_HOURS],
      user.permissions,
    )
    if (user.sub !== data.profileId) throw new PermissionDeniedError()
    const works = await this.workRepository.findManyByProfile(data.profileId)
    const dayHours = await this.dayHourRepository.findMany({
      id: { in: works.map((w) => w.dayHourId) },
    })
    const weekDay = data.startHour.getDay()
    const start = timeToMinutes(data.startHour)
    const end = timeToMinutes(data.endHour)
    const allowed = dayHours.some((dh) => {
      if (dh.weekDay !== weekDay) return false
      const s = timeToMinutes(dh.startHour)
      const e = timeToMinutes(dh.endHour)
      return start >= s && end <= e
    })
    if (!allowed) throw new Error('Hour outside working hours')

    const blockedExisting = await this.blockedRepository.findManyByProfile(
      data.profileId,
    )
    const overlap = blockedExisting.some((b) =>
      intervalsOverlap(
        data.startHour.getTime(),
        data.endHour.getTime(),
        b.startHour.getTime(),
        b.endHour.getTime(),
      ),
    )
    if (overlap) throw new Error('Hour already blocked')

    const blocked = await this.blockedRepository.create({
      profileId: data.profileId,
      startHour: data.startHour,
      endHour: data.endHour,
    })
    return { blocked }
  }
}
