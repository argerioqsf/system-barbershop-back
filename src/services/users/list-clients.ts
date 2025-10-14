import { UserToken } from '@/http/controllers/authenticate-controller'
import { BarberUsersRepository } from '@/repositories/barber-users-repository'
import { assertUser } from '@/utils/assert-user'
import { Prisma, Profile, RoleName, User } from '@prisma/client'

interface ListClientsResponse {
  users: (Omit<User, 'password'> & { profile: Profile | null })[]
}

interface ListClientsRequest {
  name?: string
}

export class ListClientsService {
  constructor(private repository: BarberUsersRepository) {}

  async execute(
    userToken: UserToken,
    params: ListClientsRequest = {},
  ): Promise<ListClientsResponse> {
    assertUser(userToken)
    const where: Prisma.UserWhereInput = {
      ...{ organizationId: userToken.organizationId },
      profile: {
        role: { name: RoleName.CLIENT },
      },
      ...(params.name && {
        name: { contains: params.name },
      }),
    }
    const users = await this.repository.findMany(where)
    return { users }
  }
}
