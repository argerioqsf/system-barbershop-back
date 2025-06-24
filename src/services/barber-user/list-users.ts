import { UserToken } from '@/http/controllers/authenticate-controller'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { DayHourRepository } from '@/repositories/day-hour-repository'
import { assertUser } from '@/utils/assert-user'
import { getScope, buildUnitWhere } from '@/utils/permissions'
import {
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  User,
  DayHour,
} from '@prisma/client'
import {
  listAvailableSlots,
  BarberWithHours,
} from '@/utils/barber-availability'

interface ListUsersResponse {
  users: (Omit<User, 'password'> & {
    profile:
      | (Profile & {
          workHours: ProfileWorkHour[]
          blockedHours: ProfileBlockedHour[]
        })
      | null
    availableSlots: DayHour[]
  })[]
}

export class ListUsersService {
  constructor(
    private repository: BarberUsersRepository,
    private appointmentRepository: AppointmentRepository,
    private dayHourRepository: DayHourRepository,
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
          this.dayHourRepository,
        ),
      })),
    )
    return { users: withSlots }
  }
}
