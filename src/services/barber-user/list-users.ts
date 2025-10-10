import { UserToken } from '@/http/controllers/authenticate-controller'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { assertUser } from '@/utils/assert-user'
import {
  Prisma,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  RoleName,
  User,
} from '@prisma/client'
import {
  listAvailableSlots,
  BarberWithHours,
} from '@/utils/barber-availability'
import { IntervalsFormatted } from '@/utils/time'

interface ListUsersRequest {
  page?: number
  perPage?: number
  name?: string
}

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
  count: number
}

export class ListUsersService {
  constructor(
    private repository: BarberUsersRepository,
    private appointmentRepository: AppointmentRepository,
  ) {}

  private filterUsersForRole(role: RoleName): RoleName[] {
    switch (role) {
      case 'ADMIN':
        return ['ADMIN', 'ATTENDANT', 'BARBER', 'CLIENT', 'MANAGER', 'OWNER']
      case 'ATTENDANT':
        return []
      case 'BARBER':
        return []
      case 'CLIENT':
        return []
      case 'MANAGER':
        return ['ATTENDANT', 'BARBER', 'CLIENT']
      case 'OWNER':
        return ['ATTENDANT', 'BARBER', 'CLIENT', 'MANAGER']
      default:
        return []
    }
  }

  async execute(
    userToken: UserToken,
    { page, perPage, name }: ListUsersRequest,
  ): Promise<ListUsersResponse> {
    assertUser(userToken)

    const where: Prisma.UserWhereInput = {
      ...{ unitId: userToken.unitId },
      ...(name && { name: { contains: name } }),
      ...{
        profile: {
          role: { name: { in: this.filterUsersForRole(userToken.role) } },
        },
      },
    }

    if (page && perPage) {
      const { users, count } = await this.repository.findManyPaginated(where, {
        page,
        perPage,
      })

      const withSlots = await Promise.all(
        users.map(async (u) => ({
          ...u,
          availableSlots: await listAvailableSlots(
            u as BarberWithHours,
            this.appointmentRepository,
          ),
        })),
      )
      return { users: withSlots, count }
    }

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
    return { users: withSlots, count: users.length }
  }
}
