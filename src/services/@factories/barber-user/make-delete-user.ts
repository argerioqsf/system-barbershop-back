import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { DeleteUserService } from '@/services/barber-user/delete-user'

export function makeDeleteUserService() {
  return new DeleteUserService(new PrismaBarberUsersRepository())
}
