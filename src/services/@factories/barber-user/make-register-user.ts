import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { RegisterUserService } from '@/services/barber-user/register-user'

export function makeRegisterUserService() {
  return new RegisterUserService(new PrismaBarberUsersRepository())
}
