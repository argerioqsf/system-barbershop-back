import { UserToken } from '@/http/controllers/authenticate-controller'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { assertUser } from '@/utils/assert-user'
import { getScope, buildUnitWhere } from '@/utils/permissions'
import {
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  User,
} from '@prisma/client'
import {
  listAvailableSlots,
  BarberWithHours,
} from '@/utils/barber-availability'
import { IntervalsFormatted } from '@/utils/time'

interface ListUsersResponse {
  users: (Omit<User, 'password'> & {
    profile:
      | (Profile & {
          workHours: ProfileWorkHour[]
          blockedHours: ProfileBlockedHour[]
        })
      | null
    availableSlots: IntervalsFormatted[]
  })[]
}

export class ListUsersService {
  constructor(
    private repository: BarberUsersRepository,
    private appointmentRepository: AppointmentRepository,
  ) {}

  async execute(userToken: UserToken): Promise<ListUsersResponse> {
    assertUser(userToken)
    const scope = getScope(userToken)
    const where = buildUnitWhere(scope)
    const users = await this.repository.findMany(where)
    const withSlots = await Promise.all(
      users.map(async (u) => ({
        ...u,
        availableSlots: await listAvailableSlots(
          u as BarberWithHours,
          this.appointmentRepository,
        ),
      })),
    )
    return { users: withSlots }
  }
}
