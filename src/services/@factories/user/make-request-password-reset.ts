import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { PrismaPasswordResetTokenRepository } from '@/repositories/prisma/prisma-password-reset-token-repository'
import { RequestPasswordResetService } from '@/services/users/request-password-reset'

export function makeRequestPasswordResetService() {
  return new RequestPasswordResetService(
    new PrismaUsersRepository(),
    new PrismaPasswordResetTokenRepository(),
  )
}
