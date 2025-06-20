import { PrismaRoleModelRepository } from '@/repositories/prisma/prisma-role-model-repository'
import { CreateRoleService } from '@/services/role/create-role'

export function makeCreateRoleService() {
  return new CreateRoleService(new PrismaRoleModelRepository())
}
