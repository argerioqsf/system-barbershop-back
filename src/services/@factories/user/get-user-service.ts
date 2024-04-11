import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { GetUserService } from '@/services/users/get-user-service'

export function makeGetUserService() {
  return new GetUserService(new PrismaUsersRepository())
}
