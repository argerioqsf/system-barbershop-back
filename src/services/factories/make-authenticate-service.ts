import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { AuthenticateService } from '../authenticate_service'

export function makeAuthenticateService() {
  const prismaUserRepository = new PrismaUsersRepository()
  const authenticateService = new AuthenticateService(prismaUserRepository)

  return authenticateService
}
