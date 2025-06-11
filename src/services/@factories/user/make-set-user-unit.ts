import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { SetUserUnitService } from '@/services/users/set-user-unit'

export function makeSetUserUnitService() {
  return new SetUserUnitService(
    new PrismaUsersRepository(),
    new PrismaUnitRepository(),
  )
}
