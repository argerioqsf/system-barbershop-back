import { PrismaRoleRepository } from '@/repositories/prisma/prisma-role-repository'
import { ListRolesService } from '@/services/role/list-roles'

export function makeListRolesService() {
  return new ListRolesService(new PrismaRoleRepository())
}
