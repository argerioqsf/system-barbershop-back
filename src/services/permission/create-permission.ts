import { PermissionRepository } from '@/repositories/permission-repository'
import { Permission, PermissionName } from '@prisma/client'

interface CreatePermissionRequest {
  name: PermissionName
  featureIds: string[]
  unitId: string
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
    })
    return { permission }
  }
}
