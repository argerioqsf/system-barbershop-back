import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { PrismaPermissionRepository } from '@/repositories/prisma/prisma-permission-repository'
import { UpdateUserService } from '@/services/barber-user/update-user'
import { PrismaBarberServiceRepository } from '@/repositories/prisma/prisma-barber-service-repository'
import { PrismaBarberProductRepository } from '@/repositories/prisma/prisma-barber-product-repository'

export function makeUpdateUserService() {
  return new UpdateUserService(
    new PrismaBarberUsersRepository(),
    new PrismaUnitRepository(),
    new PrismaPermissionRepository(),
    new PrismaBarberServiceRepository(),
    new PrismaBarberProductRepository(),
  )
}
