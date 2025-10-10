import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PrismaPermissionRepository } from '@/repositories/prisma/prisma-permission-repository'
import { RegisterUserService } from '../barber-user/register-user'
import { PrismaRoleRepository } from '@/repositories/prisma/prisma-role-repository'
import { PrismaBarberServiceRepository } from '@/repositories/prisma/prisma-barber-service-repository'
import { PrismaBarberProductRepository } from '@/repositories/prisma/prisma-barber-product-repository'

export function makeRegisterService() {
  const repository = new PrismaBarberUsersRepository()
  const unitRepository = new PrismaUnitRepository()
  const permissionRepository = new PrismaPermissionRepository()
  const roleRepository = new PrismaRoleRepository()
  const barberServiceRepository = new PrismaBarberServiceRepository()
  const barberProductRepository = new PrismaBarberProductRepository()
  const registerService = new RegisterUserService(
    repository,
    unitRepository,
    permissionRepository,
    roleRepository,
    barberServiceRepository,
    barberProductRepository,
  )

  return registerService
}
