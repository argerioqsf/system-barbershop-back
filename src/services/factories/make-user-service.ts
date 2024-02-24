import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { UserService } from '../users-services'

export function makeUserService() {
  const prismaUserRepository = new PrismaUsersRepository()
  const userService = new UserService(prismaUserRepository)

  return userService
}
