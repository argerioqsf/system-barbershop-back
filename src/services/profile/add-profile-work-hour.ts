import { ProfileWorkHourRepository } from '@/repositories/profile-work-hour-repository'
import { ProfileWorkHour, PermissionName } from '@prisma/client'
import { PermissionDeniedError } from '../@errors/permission/permission-denied-error'

import { assertPermission } from '@/utils/permissions'
import { UserToken } from '@/http/controllers/authenticate-controller'

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
    user: UserToken,
    data: AddProfileWorkHourRequest,
  ): Promise<AddProfileWorkHourResponse> {
    await assertPermission(
      [PermissionName.MANAGE_SELF_WORK_HOURS],
      user.permissions,
    )
    if (user.sub !== data.profileId) throw new PermissionDeniedError()
    const current = await this.repository.findManyByProfile(data.profileId)
    const duplicate = current.some((w) => w.dayHourId === data.dayHourId)
    if (duplicate) throw new Error('DayHour already added')

    const workHour = await this.repository.create({
      profileId: data.profileId,
      dayHourId: data.dayHourId,
    })
    return { workHour }
  }
}
