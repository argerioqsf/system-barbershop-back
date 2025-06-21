import { PermissionRepository } from '@/repositories/permission-repository'
import { Permission, PermissionCategory, PermissionName } from '@prisma/client'

interface CreatePermissionRequest {
  name: PermissionName
  category: PermissionCategory
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
      category: data.category,
    })
    return { permission }
  }
}
