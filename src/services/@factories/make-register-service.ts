import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PrismaPermissionRepository } from '@/repositories/prisma/prisma-permission-repository'
import { RegisterUserService } from '../barber-user/register-user'
import { PrismaRoleRepository } from '@/repositories/prisma/prisma-role-repository'

export function makeRegisterService() {
  const repository = new PrismaBarberUsersRepository()
  const unitRepository = new PrismaUnitRepository()
  const permissionRepository = new PrismaPermissionRepository()
  const roleRepository = new PrismaRoleRepository()
  const registerService = new RegisterUserService(
    repository,
    unitRepository,
    permissionRepository,
    roleRepository,
  )

  return registerService
}
