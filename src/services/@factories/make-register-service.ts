import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { PrismaUnitRepository } from '@/repositories/prisma/prisma-unit-repository'
import { RegisterUserService } from '../barber-user/register-user'

export function makeRegisterService() {
  const repository = new PrismaBarberUsersRepository()
  const unitRepository = new PrismaUnitRepository()
  const registerService = new RegisterUserService(repository, unitRepository)

  return registerService
}
