import { PermissionRepository } from '@/repositories/permission-repository'
import { Permission } from '@prisma/client'

interface CreatePermissionRequest {
  name: string
  featureIds: string[]
  unitId: string
  roleIds?: string[]
}

interface CreatePermissionResponse {
  permission: Permission
}

export class CreatePermissionService {
  constructor(private repository: PermissionRepository) {}

  async execute(
    data: CreatePermissionRequest,
  ): Promise<CreatePermissionResponse> {
    const permission = await this.repository.create({
      name: data.name,
      unit: { connect: { id: data.unitId } },
      features: { connect: data.featureIds.map((id) => ({ id })) },
      ...(data.roleIds && {
        roles: { connect: data.roleIds.map((id) => ({ id })) },
      }),
    })
    return { permission }
  }
}
