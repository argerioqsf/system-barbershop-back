import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import {
  BarberService,
  Permission,
  Profile,
  ProfileBlockedHour,
  ProfileWorkHour,
  Role,
  User,
} from '@prisma/client'

interface GetUserRequest {
  id: string
}

interface GetUserResponse {
  user:
    | (User & {
        profile:
          | (Profile & {
              role: Role
              permissions: Permission[]
              workHours: ProfileWorkHour[]
              blockedHours: ProfileBlockedHour[]
              barberServices: BarberService[]
            })
          | null
      })
    | null
}

export class GetUserService {
  constructor(private repository: BarberUsersRepository) {}

  async execute({ id }: GetUserRequest): Promise<GetUserResponse> {
    const user = await this.repository.findById(id)
    return { user }
  }
}
