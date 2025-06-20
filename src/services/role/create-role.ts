import { RoleRepository } from '@/repositories/role-repository'
import { Role } from '@prisma/client'

interface CreateRoleRequest {
  name: string
  unitId: string
  permissionIds: string[]
}

interface CreateRoleResponse {
  role: Role
}

export class CreateRoleService {
  constructor(private repository: RoleRepository) {}

  async execute(data: CreateRoleRequest): Promise<CreateRoleResponse> {
    const role = await this.repository.create({
      name: data.name as any,
      unit: { connect: { id: data.unitId } },
      permissions: { connect: data.permissionIds.map((id) => ({ id })) },
    })
    return { role }
  }
}
