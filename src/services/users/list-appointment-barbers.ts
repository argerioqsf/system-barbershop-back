import { UserToken } from '@/http/controllers/authenticate-controller'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { assertUser } from '@/utils/assert-user'
import { getScope, buildUnitWhere } from '@/utils/permissions'
import { PermissionName, Profile, User } from '@prisma/client'

interface ListAppointmentBarbersResponse {
  users: (Omit<User, 'password'> & { profile: Profile | null })[]
}

export class ListAppointmentBarbersService {
  constructor(private repository: BarberUsersRepository) {}

  async execute(userToken: UserToken): Promise<ListAppointmentBarbersResponse> {
    assertUser(userToken)
    const scope = getScope(userToken)
    const where = {
      ...buildUnitWhere(scope),
      profile: {
        permissions: { some: { name: PermissionName.ACCEPT_APPOINTMENT } },
      },
    }
    const users = await this.repository.findMany(where)
    return { users }
  }
}
