import { PrismaPermissionRepository } from '@/repositories/prisma/prisma-permission-repository'
import { CreatePermissionService } from '@/services/permission/create-permission'

export function makeCreatePermissionService() {
  return new CreatePermissionService(new PrismaPermissionRepository())
}
