import { UserToken } from '@/http/controllers/authenticate-controller'
import { RoleModelRepository } from '@/repositories/role-model-repository'
import { assertPermission } from '@/utils/permissions'
import { assertUser } from '@/utils/assert-user'
import { RoleModel } from '@prisma/client'

interface ListRolesResponse {
  roles: RoleModel[]
}

export class ListRolesService {
  constructor(private repository: RoleModelRepository) {}

  async execute(user: UserToken): Promise<ListRolesResponse> {
    assertUser(user)
    assertPermission(user.role, 'LIST_ROLES')
    const roles = await this.repository.findMany({ unitId: user.unitId })
    return { roles }
  }
}
