import { UserToken } from '@/http/controllers/authenticate-controller'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { assertUser } from '@/utils/assert-user'
import { getScope, buildUnitWhere } from '@/utils/permissions'
import { Profile, User } from '@prisma/client'

interface ListUsersResponse {
  users: (Omit<User, 'password'> & { profile: Profile | null })[]
}

export class ListUsersService {
  constructor(private repository: BarberUsersRepository) {}

  async execute(userToken: UserToken): Promise<ListUsersResponse> {
    assertUser(userToken)
    const scope = getScope(userToken)
    const where = buildUnitWhere(scope)
    const users = await this.repository.findMany(where)
    return { users }
  }
}
