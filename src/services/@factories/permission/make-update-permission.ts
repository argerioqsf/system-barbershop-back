import { PrismaPermissionRepository } from '@/repositories/prisma/prisma-permission-repository'
import { UpdatePermissionService } from '@/services/permission/update-permission'

export function makeUpdatePermissionService() {
  return new UpdatePermissionService(new PrismaPermissionRepository())
}
