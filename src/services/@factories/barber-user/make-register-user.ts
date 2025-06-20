import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaPermissionRepository } from '@/repositories/prisma/prisma-permission-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { RegisterUserService } from '@/services/barber-user/register-user'

export function makeRegisterUserService() {
  return new RegisterUserService(
    new PrismaBarberUsersRepository(),
    new PrismaUnitRepository(),
    new PrismaPermissionRepository(),
  )
}
