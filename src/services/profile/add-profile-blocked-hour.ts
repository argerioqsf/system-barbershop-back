import { ProfileBlockedHourRepository } from '@/repositories/profile-blocked-hour-repository'
import { ProfileWorkHourRepository } from '@/repositories/profile-work-hour-repository'
import { ProfileBlockedHour, PermissionName } from '@prisma/client'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { assertPermission } from '@/utils/permissions'
import { timeToMinutes, intervalsOverlap } from '@/utils/time'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { ProfileNotFoundError } from '../@errors/profile/profile-not-found-error'

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
    private profileRepository: ProfilesRepository,
  ) {}

  async execute(
    user: UserToken,
    data: AddProfileBlockedHourRequest,
  ): Promise<AddProfileBlockedHourResponse> {
    const profileRequest = await this.profileRepository.findByUserId(user.sub)
    if (!profileRequest) throw new ProfileNotFoundError()

    if (profileRequest.id === data.profileId) {
      assertPermission(
        [PermissionName.MANAGE_SELF_BLOCKED_HOURS],
        user.permissions,
      )
    }

    assertPermission(
      [PermissionName.MENAGE_USERS_BLOCKED_HOURS],
      user.permissions,
    )

    const works = await this.workRepository.findManyByProfile(data.profileId)
    const weekDay = data.startHour.getDay()
    const start = timeToMinutes(data.startHour)
    const end = timeToMinutes(data.endHour)

    const allowed = works.some((wh) => {
      if (wh.weekDay !== weekDay) return false
      const s = timeToMinutes(wh.startHour)
      const e = timeToMinutes(wh.endHour)
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
