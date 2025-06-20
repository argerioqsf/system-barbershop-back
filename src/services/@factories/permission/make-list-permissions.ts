import { PrismaPermissionRepository } from '@/repositories/prisma/prisma-permission-repository'
import { ListPermissionsService } from '@/services/permission/list-permissions'

export function makeListPermissionsService() {
  return new ListPermissionsService(new PrismaPermissionRepository())
}
