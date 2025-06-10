import { prisma } from '@/lib/prisma'
import { Prisma, PasswordResetToken } from '@prisma/client'
import { PasswordResetTokenRepository } from '../password-reset-token-repository'

export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepository {
  async create(data: Prisma.PasswordResetTokenCreateInput): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({ data })
  }

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findUnique({ where: { token } })
  }

  async delete(id: string): Promise<void> {
    await prisma.passwordResetToken.delete({ where: { id } })
  }

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.passwordResetToken.deleteMany({ where: { userId } })
  }
}
