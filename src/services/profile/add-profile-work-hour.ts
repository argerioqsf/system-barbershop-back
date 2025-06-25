import { ProfileWorkHourRepository } from '@/repositories/profile-work-hour-repository'
import { UnitOpeningHourRepository } from '@/repositories/unit-opening-hour-repository'
import { ProfileWorkHour, PermissionName } from '@prisma/client'

import { assertPermission } from '@/utils/permissions'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { ProfilesRepository } from '@/repositories/profiles-repository'
import { ProfileNotFoundError } from '../@errors/profile/profile-not-found-error'
import {
  mergeIntervals,
  minutesToTime,
  subtractIntervals,
  timeToMinutes,
} from '@/utils/time'
import { TimeIntervalOverlapsError } from '../@errors/profile/time-interval-overlaps-error'
import { WorkHourOutsideOpeningHoursError } from '../@errors/profile/work-hour-outside-opening-hours-error'

interface AddProfileWorkHourRequest {
  profileId: string
  weekDay: number
  startHour: string
  endHour: string
}

interface AddProfileWorkHourResponse {
  workHour: ProfileWorkHour
  workingHours: {
    start: string
    end: string
  }[]
}

export class AddProfileWorkHourService {
  constructor(
    private repository: ProfileWorkHourRepository,
    private profileRepository: ProfilesRepository,
    private openingHourRepository: UnitOpeningHourRepository,
  ) {}

  async execute(
    user: UserToken,
    data: AddProfileWorkHourRequest,
  ): Promise<AddProfileWorkHourResponse> {
    const profileRequest = await this.profileRepository.findByUserId(user.sub)
    if (!profileRequest) throw new ProfileNotFoundError()
    const slotDuration = profileRequest.user.unit.slotDuration ?? 30

    if (profileRequest.id === data.profileId) {
      assertPermission(
        [PermissionName.MANAGE_SELF_WORK_HOURS],
        user.permissions,
      )
    }

    assertPermission(
      [PermissionName.MENAGE_USERS_WORKING_HOURS],
      user.permissions,
    )

    const profile = await this.profileRepository.findById(data.profileId)
    if (!profile) throw new ProfileNotFoundError()

    const unitHours = await this.openingHourRepository.findManyByUnit(
      profile.user.unitId,
    )
    const openIntervals = unitHours
      .filter((oh) => oh.weekDay === data.weekDay)
      .map((oh) => ({
        start: timeToMinutes(oh.startHour),
        end: timeToMinutes(oh.endHour),
      }))

    const workHourAvaiable = {
      start: timeToMinutes(data.startHour),
      end: timeToMinutes(data.endHour),
    }

    const insideOpening = openIntervals.some(
      (o) => workHourAvaiable.start >= o.start && workHourAvaiable.end <= o.end,
    )

    if (!insideOpening) throw new WorkHourOutsideOpeningHoursError()

    const current = await this.repository.findManyByProfile(
      data.profileId,
      data.weekDay,
    )

    const currentMap = current.map((dh) => ({
      start: timeToMinutes(dh.startHour),
      end: timeToMinutes(dh.endHour),
    }))

    const verifyOverlay = subtractIntervals([workHourAvaiable], currentMap)
    if (
      verifyOverlay.length === 0 ||
      verifyOverlay[0].start !== workHourAvaiable.start ||
      verifyOverlay[0].end !== workHourAvaiable.end
    )
      throw new TimeIntervalOverlapsError()

    const duplicate = current.some(
      (w) =>
        w.weekDay === data.weekDay &&
        w.startHour === data.startHour &&
        w.endHour === data.endHour,
    )
    if (duplicate) throw new Error('WorkHour already added')

    const workingHours = mergeIntervals(
      [...currentMap, ...[workHourAvaiable]],
      slotDuration,
    ).map((wh) => ({
      start: minutesToTime(wh.start),
      end: minutesToTime(wh.end),
      weekDay: wh.weekDay,
    }))

    const workHour = await this.repository.create({
      profileId: data.profileId,
      weekDay: data.weekDay,
      startHour: data.startHour,
      endHour: data.endHour,
    })
    return { workHour, workingHours }
  }
}
