import { PrismaPasswordResetTokenRepository } from '@/repositories/prisma/prisma-password-reset-token-repository'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { ResetPasswordWithTokenService } from '@/services/users/reset-password-with-token'

export function makeResetPasswordWithTokenService() {
  return new ResetPasswordWithTokenService(
    new PrismaPasswordResetTokenRepository(),
    new PrismaUsersRepository(),
  )
}
