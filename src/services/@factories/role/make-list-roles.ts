import { PrismaRoleModelRepository } from '@/repositories/prisma/prisma-role-model-repository'
import { ListRolesService } from '@/services/role/list-roles'

export function makeListRolesService() {
  return new ListRolesService(new PrismaRoleModelRepository())
}
