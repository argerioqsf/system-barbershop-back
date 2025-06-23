import { UserToken } from '@/http/controllers/authenticate-controller'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { assertUser } from '@/utils/assert-user'
import { getScope, buildUnitWhere } from '@/utils/permissions'
import { PermissionName, Profile, User } from '@prisma/client'

interface ListProductSellersResponse {
  users: (Omit<User, 'password'> & { profile: Profile | null })[]
}

export class ListProductSellersService {
  constructor(private repository: BarberUsersRepository) {}

  async execute(userToken: UserToken): Promise<ListProductSellersResponse> {
    assertUser(userToken)
    const scope = getScope(userToken)
    const where = {
      ...buildUnitWhere(scope),
      profile: { permissions: { some: { name: PermissionName.SELL_PRODUCT } } },
    }
    const users = await this.repository.findMany(where)
    return { users }
  }
}
