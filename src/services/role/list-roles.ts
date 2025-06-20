import { UserToken } from '@/http/controllers/authenticate-controller'
import { RoleRepository } from '@/repositories/role-repository'
import { assertPermission } from '@/utils/permissions'
import { assertUser } from '@/utils/assert-user'
import { Role } from '@prisma/client'

interface ListRolesResponse {
  roles: Role[]
}

export class ListRolesService {
  constructor(private repository: RoleRepository) {}

  async execute(user: UserToken): Promise<ListRolesResponse> {
    assertUser(user)
    await assertPermission(['LIST_ROLES_UNIT'], user.permissions)
    const roles = await this.repository.findMany({ unitId: user.unitId })
    return { roles }
  }
}
