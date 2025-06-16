import { PasswordResetTokenRepository } from '@/repositories/password-reset-token-repository'
import { UsersRepository } from '@/repositories/users-repository'
import { hash } from 'bcryptjs'
import { UserNotFoundError } from '../@errors/user-not-found-error'
import { ResourceNotFoundError } from '../@errors/resource-not-found-error'

interface ResetPasswordWithTokenRequest {
  token: string
  password: string
}

export class ResetPasswordWithTokenService {
  constructor(
    private tokenRepository: PasswordResetTokenRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    token,
    password,
  }: ResetPasswordWithTokenRequest): Promise<void> {
    const tokenRecord = await this.tokenRepository.findByToken(token)
    if (!tokenRecord) throw new ResourceNotFoundError()
    if (tokenRecord.expiresAt < new Date()) {
      await this.tokenRepository.delete(tokenRecord.id)
      throw new ResourceNotFoundError()
    }

    const user = await this.usersRepository.findById(tokenRecord.userId)
    if (!user) throw new UserNotFoundError()

    const password_hash = await hash(password, 6)
    await this.usersRepository.update(user.id, { password: password_hash })

    await this.tokenRepository.delete(tokenRecord.id)
  }
}
