import { RoleRepository } from '@/repositories/role-repository'
import { Role, RoleName } from '@prisma/client'

interface UpdateRoleRequest {
  id: string
  name?: RoleName
  permissionIds?: string[]
}

interface UpdateRoleResponse {
  role: Role
}

export class UpdateRoleService {
  constructor(private repository: RoleRepository) {}

  async execute({
    id,
    name,
    permissionIds,
  }: UpdateRoleRequest): Promise<UpdateRoleResponse> {
    const role = await this.repository.update(
      id,
      {
        ...(name && { name }),
      },
      permissionIds,
    )
    return { role }
  }
}
