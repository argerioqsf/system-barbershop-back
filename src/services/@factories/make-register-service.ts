import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { RegisterUserService } from '../barber-user/register-user'

export function makeRegisterService() {
  const repository = new PrismaBarberUsersRepository()
  const registerService = new RegisterUserService(repository)

  return registerService
}
