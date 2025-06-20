import { RoleModelRepository } from '@/repositories/role-model-repository'
import { RoleModel } from '@prisma/client'

interface CreateRoleRequest {
  name: string
  unitId: string
  permissionIds?: string[]
}

interface CreateRoleResponse {
  role: RoleModel
}

export class CreateRoleService {
  constructor(private repository: RoleModelRepository) {}

  async execute(data: CreateRoleRequest): Promise<CreateRoleResponse> {
    const role = await this.repository.create({
      name: data.name,
      unit: { connect: { id: data.unitId } },
      ...(data.permissionIds && {
        permissions: { connect: data.permissionIds.map((id) => ({ id })) },
      }),
    })
    return { role }
  }
}
