import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { ResetPasswordService } from '@/services/users/reset-password-service'

export function makeResetPasswordService() {
  return new ResetPasswordService(new PrismaUsersRepository())
}
