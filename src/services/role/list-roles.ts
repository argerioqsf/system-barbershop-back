import { UserToken } from '@/http/controllers/authenticate-controller'
import { RoleRepository } from '@/repositories/role-repository'
import { hasPermission } from '@/utils/permissions'
import { assertUser } from '@/utils/assert-user'
import { Role } from '@prisma/client'
import { UnauthorizedError } from '../@errors/auth/unauthorized-error'

interface ListRolesResponse {
  roles: Role[]
}

export class ListRolesService {
  constructor(private repository: RoleRepository) {}

  async execute(user: UserToken): Promise<ListRolesResponse> {
    assertUser(user)
    let roles: Role[] = []
    if (hasPermission(['LIST_ROLES_ALL'], user.permissions)) {
      roles = await this.repository.findMany()
    } else if (hasPermission(['LIST_ROLES_UNIT'], user.permissions)) {
      roles = await this.repository.findMany({ unitId: user.unitId })
    } else {
      throw new UnauthorizedError()
    }
    return { roles }
  }
}
