import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { UpdateUserService } from '@/services/barber-user/update-user'

export function makeUpdateUserService() {
  return new UpdateUserService(
    new PrismaBarberUsersRepository(),
    new PrismaUnitRepository(),
  )
}
