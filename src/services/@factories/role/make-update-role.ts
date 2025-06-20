import { PrismaRoleRepository } from '@/repositories/prisma/prisma-role-repository'
import { UpdateRoleService } from '@/services/role/update-role'

export function makeUpdateRoleService() {
  return new UpdateRoleService(new PrismaRoleRepository())
}
