import { UserToken } from '@/http/controllers/authenticate-controller'
import { PermissionRepository } from '@/repositories/permission-repository'
import { assertPermission } from '@/utils/permissions'
import { assertUser } from '@/utils/assert-user'
import { Permission } from '@prisma/client'

interface ListPermissionsResponse {
  permissions: Permission[]
}

export class ListPermissionsService {
  constructor(private repository: PermissionRepository) {}

  async execute(user: UserToken): Promise<ListPermissionsResponse> {
    assertUser(user)
    assertPermission(user.role, 'LIST_PERMISSIONS')
    const permissions = await this.repository.findMany({ unitId: user.unitId })
    return { permissions }
  }
}
