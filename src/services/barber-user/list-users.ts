import { UserToken } from '@/http/controllers/authenticate-controller'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { Profile, User } from '@prisma/client'

interface ListUsersResponse {
  users: (User & { profile: Profile | null })[]
}

export class ListUsersService {
  constructor(private repository: BarberUsersRepository) {}

  async execute(userToken: UserToken): Promise<ListUsersResponse> {
    if (!userToken.sub) throw new Error('User not found')
    let users = []

    if (userToken.role === 'OWNER') {
      users = await this.repository.findMany({
        unit: { organizationId: userToken.organizationId },
      })
    } else if (userToken.role === 'ADMIN') {
      users = await this.repository.findMany()
    } else {
      users = await this.repository.findMany({
        unitId: userToken.unitId,
      })
    }
    return { users }
  }
}
