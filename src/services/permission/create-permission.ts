import { PermissionRepository } from '@/repositories/permission-repository'
import { Permission } from '@prisma/client'

interface CreatePermissionRequest {
  action: string
  category: string
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
      action: data.action,
      category: data.category,
      unit: { connect: { id: data.unitId } },
    })
    return { permission }
  }
}
