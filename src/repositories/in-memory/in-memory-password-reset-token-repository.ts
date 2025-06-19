import { Prisma, PasswordResetToken } from '@prisma/client'
import { PasswordResetTokenRepository } from '../password-reset-token-repository'
import { randomUUID } from 'crypto'

export class InMemoryPasswordResetTokenRepository
  implements PasswordResetTokenRepository
{
  public tokens: PasswordResetToken[] = []

  async create(
    data: Prisma.PasswordResetTokenCreateInput,
  ): Promise<PasswordResetToken> {
    const token: PasswordResetToken = {
      id: randomUUID(),
      token: data.token as string,
      userId: (data.user as { connect: { id: string } }).connect.id,
      expiresAt: data.expiresAt as Date,
      createdAt: new Date(),
    }
    this.tokens.push(token)
    return token
  }

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    return this.tokens.find((t) => t.token === token) ?? null
  }

  async delete(id: string): Promise<void> {
    this.tokens = this.tokens.filter((t) => t.id !== id)
  }

  async deleteByUserId(userId: string): Promise<void> {
    this.tokens = this.tokens.filter((t) => t.userId !== userId)
  }
}
