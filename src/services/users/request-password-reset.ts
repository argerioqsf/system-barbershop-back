import { UsersRepository } from '@/repositories/users-repository'
import { PasswordResetTokenRepository } from '@/repositories/password-reset-token-repository'
import { sendPasswordResetEmail } from '@/lib/sendgrid'
import { env } from '@/env'
import { randomUUID } from 'crypto'
import { addHours } from 'date-fns'
import { UserNotFoundError } from '../@errors/user/user-not-found-error'

interface RequestPasswordResetServiceRequest {
  email: string
}

export class RequestPasswordResetService {
  constructor(
    private usersRepository: UsersRepository,
    private tokenRepository: PasswordResetTokenRepository,
  ) {}

  async execute({ email }: RequestPasswordResetServiceRequest): Promise<void> {
    const user = await this.usersRepository.findByEmail(email)
    if (!user) throw new UserNotFoundError()

    await this.tokenRepository.deleteByUserId(user.id)

    const token = randomUUID()
    const expiresAt = addHours(new Date(), 1)

    await this.tokenRepository.create({
      token,
      expiresAt,
      user: { connect: { id: user.id } },
    })

    const link = `${env.APP_WEB_URL}/reset-password?token=${token}`
    await sendPasswordResetEmail(user.email, user.name, link)
  }
}
