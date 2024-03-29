import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { GetUsersService } from '@/services/users/get-users-service'

export function getUsersService() {
  return new GetUsersService(new PrismaUsersRepository())
}
