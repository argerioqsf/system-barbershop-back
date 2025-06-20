import { PrismaRoleRepository } from '@/repositories/prisma/prisma-role-repository'
import { CreateRoleService } from '@/services/role/create-role'

export function makeCreateRoleService() {
  return new CreateRoleService(new PrismaRoleRepository())
}
