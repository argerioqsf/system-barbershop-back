import { PermissionRepository } from '@/repositories/permission-repository'
import { Permission, PermissionCategory, PermissionName } from '@prisma/client'

interface UpdatePermissionRequest {
  id: string
  name?: PermissionName
  category?: PermissionCategory
}

interface UpdatePermissionResponse {
  permission: Permission
}

export class UpdatePermissionService {
  constructor(private repository: PermissionRepository) {}

  async execute({
    id,
    name,
    category,
  }: UpdatePermissionRequest): Promise<UpdatePermissionResponse> {
    const permission = await this.repository.update(id, {
      ...(name && { name }),
      ...(category && { category }),
    })
    return { permission }
  }
}
