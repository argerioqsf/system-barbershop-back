import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import { DayHourRepository } from '@/repositories/day-hour-repository'
import {
  BarberService,
  Permission,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  Role,
  User,
  DayHour,
} from '@prisma/client'
import {
  listAvailableSlots,
  BarberWithHours,
} from '@/utils/barber-availability'

interface GetUserRequest {
  id: string
}

interface GetUserResponse {
  user:
    | ((User & {
        profile:
          | (Profile & {
              role: Role
              permissions: Permission[]
              workHours: ProfileWorkHour[]
              blockedHours: ProfileBlockedHour[]
              barberServices: BarberService[]
            })
          | null
      }) & { availableSlots: DayHour[] })
    | null
}

export class GetUserService {
  constructor(
    private repository: BarberUsersRepository,
    private appointmentRepository: AppointmentRepository,
    private dayHourRepository: DayHourRepository,
  ) {}

  async execute({ id }: GetUserRequest): Promise<GetUserResponse> {
    const user = await this.repository.findById(id)
    if (!user) return { user: null }

    const availableSlots = await listAvailableSlots(
      user as BarberWithHours,
      this.appointmentRepository,
      this.dayHourRepository,
    )

    return { user: { ...user, availableSlots } }
  }
}
