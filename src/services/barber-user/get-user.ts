import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { AppointmentRepository } from '@/repositories/appointment-repository'
import {
  BarberService,
  Permission,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  Role,
  User,
} from '@prisma/client'
import {
  listAvailableSlots,
  BarberWithHours,
  AvailableSlot,
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
      }) & { availableSlots: AvailableSlot[] })
    | null
}

export class GetUserService {
  constructor(
    private repository: BarberUsersRepository,
    private appointmentRepository: AppointmentRepository,
  ) {}

  async execute({ id }: GetUserRequest): Promise<GetUserResponse> {
    const user = await this.repository.findById(id)
    if (!user) return { user: null }

    const availableSlots = await listAvailableSlots(
      user as BarberWithHours,
      this.appointmentRepository,
    )

    return { user: { ...user, availableSlots } }
  }
}
