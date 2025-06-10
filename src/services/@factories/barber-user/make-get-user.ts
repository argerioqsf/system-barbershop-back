import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { GetUserService } from '@/services/barber-user/get-user'

export function makeGetUserService() {
  return new GetUserService(new PrismaBarberUsersRepository())
}
