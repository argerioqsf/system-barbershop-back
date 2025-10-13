import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaPermissionRepository } from '@/repositories/prisma/prisma-permission-repository'
import { PrismaRoleRepository } from '@/repositories/prisma/prisma-role-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { RegisterUserService } from '@/services/barber-user/register-user'
import { PrismaBarberServiceRepository } from '@/repositories/prisma/prisma-barber-service-repository'
import { PrismaBarberProductRepository } from '@/repositories/prisma/prisma-barber-product-repository'

export function makeRegisterUserService() {
  return new RegisterUserService(
    new PrismaBarberUsersRepository(),
    new PrismaUnitRepository(),
    new PrismaPermissionRepository(),
    new PrismaRoleRepository(),
    new PrismaBarberServiceRepository(),
    new PrismaBarberProductRepository(),
  )
}
