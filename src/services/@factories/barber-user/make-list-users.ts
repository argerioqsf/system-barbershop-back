import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { ListUsersService } from '@/services/barber-user/list-users'

export function makeListUsersService() {
  return new ListUsersService(new PrismaBarberUsersRepository())
}
