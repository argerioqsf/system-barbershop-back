process.env.JWT_SECRET = 'test'
process.env.PASSWORD_SEED = 'test'
process.env.TOKEN_EMAIL_TWILIO = 'test'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RequestPasswordResetService } from '../src/services/users/request-password-reset'
import { InMemoryUserRepository } from '../src/repositories/in-memory/in-memory-users-repository'
import { FakePasswordResetTokenRepository } from './helpers/fake-repositories'
import { UserNotFoundError } from '../src/services/@errors/user-not-found-error'
import { sendPasswordResetEmail } from '../src/lib/sendgrid'
process.env.APP_WEB_URL = 'http://localhost:3000'

vi.mock('../src/lib/sendgrid', () => ({
  sendPasswordResetEmail: vi.fn(),
}))

describe('Request password reset service', () => {
  let userRepo: InMemoryUserRepository
  let tokenRepo: FakePasswordResetTokenRepository
  let service: RequestPasswordResetService

  beforeEach(() => {
    userRepo = new InMemoryUserRepository()
    tokenRepo = new FakePasswordResetTokenRepository()
    service = new RequestPasswordResetService(userRepo, tokenRepo)
    ;(sendPasswordResetEmail as any).mockClear()
  })

  it('throws when user is not found', async () => {
    await expect(
      service.execute({ email: 'test@example.com' }),
    ).rejects.toBeInstanceOf(UserNotFoundError)
  })

  it('creates reset token and sends email', async () => {
    const user = await userRepo.create({
      name: 'John',
      email: 'john@example.com',
      password: '123456',
      organization: { connect: { id: 'org-1' } },
      unit: { connect: { id: 'unit-1' } },
    })

    await service.execute({ email: user.email })

    expect(tokenRepo.tokens).toHaveLength(1)
    expect(tokenRepo.tokens[0].userId).toBe(user.id)
    const diff = tokenRepo.tokens[0].expiresAt.getTime() - Date.now()
    expect(diff).toBeGreaterThan(3599000)
    expect(diff).toBeLessThan(3601000)
    expect(sendPasswordResetEmail).toHaveBeenCalled()
  })
})
