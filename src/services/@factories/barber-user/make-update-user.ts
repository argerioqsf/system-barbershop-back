import { PrismaBarberUsersRepository } from '@/repositories/prisma/prisma-barber-users-repository'
import { UpdateUserService } from '@/services/barber-user/update-user'

export function makeUpdateUserService() {
  return new UpdateUserService(new PrismaBarberUsersRepository())
}
