import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { assertUser } from '@/utils/assert-user'
import { buildUnitWhere, getScope } from '@/utils/permissions'
import { PermissionName, Profile, User } from '@prisma/client'

export interface ListAvailableBarbersOutput {
  users: (Omit<User, 'password'> & { profile: Profile | null })[]
}

export class ListAvailableBarbersUseCase {
  constructor(private readonly barberUsersRepository: BarberUsersRepository) {}

  async execute(userToken: UserToken): Promise<ListAvailableBarbersOutput> {
    assertUser(userToken)
    const scope = getScope(userToken)
    const where = {
      ...buildUnitWhere(scope),
      profile: {
        permissions: {
          some: { name: PermissionName.ACCEPT_APPOINTMENT },
        },
      },
    }

    const users = await this.barberUsersRepository.findMany(where)

    return { users }
  }
}
