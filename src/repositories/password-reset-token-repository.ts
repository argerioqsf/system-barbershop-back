import { Prisma, PasswordResetToken } from '@prisma/client'

export interface PasswordResetTokenRepository {
  create(
    data: Prisma.PasswordResetTokenCreateInput,
  ): Promise<PasswordResetToken>
  findByToken(token: string): Promise<PasswordResetToken | null>
  delete(id: string): Promise<void>
  deleteByUserId(userId: string): Promise<void>
}
