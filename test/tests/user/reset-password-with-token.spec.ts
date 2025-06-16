import { describe, it, expect, beforeEach } from 'vitest'
import { ResetPasswordWithTokenService } from '../../../src/services/users/reset-password-with-token'
import { InMemoryUserRepository } from '../../../src/repositories/in-memory/in-memory-users-repository'
import { FakePasswordResetTokenRepository } from '../../helpers/fake-repositories'
import { ResourceNotFoundError } from '../../../src/services/@errors/resource-not-found-error'
import { UserNotFoundError } from '../../../src/services/@errors/user-not-found-error'
import { compare } from 'bcryptjs'

describe('Reset password with token service', () => {
  let userRepo: InMemoryUserRepository
  let tokenRepo: FakePasswordResetTokenRepository
  let service: ResetPasswordWithTokenService
  let user: any

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository()
    tokenRepo = new FakePasswordResetTokenRepository()
    service = new ResetPasswordWithTokenService(tokenRepo, userRepo)
    user = await userRepo.create({
      name: 'John',
      email: 'john@example.com',
      password: '123456',
      organization: { connect: { id: 'org-1' } },
      unit: { connect: { id: 'unit-1' } },
    })
  })

  it('throws when token not found', async () => {
    await expect(
      service.execute({ token: 'invalid', password: 'newpass' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
  })

  it('throws when token is expired', async () => {
    tokenRepo.tokens.push({
      id: '1',
      token: 'abc',
      userId: user.id,
      expiresAt: new Date(Date.now() - 1000),
    })

    await expect(
      service.execute({ token: 'abc', password: 'newpass' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
    expect(tokenRepo.tokens).toHaveLength(0)
  })

  it('throws when user not found', async () => {
    tokenRepo.tokens.push({
      id: '1',
      token: 'abc',
      userId: 'other',
      expiresAt: new Date(Date.now() + 1000 * 60),
    })

    await expect(
      service.execute({ token: 'abc', password: 'newpass' }),
    ).rejects.toBeInstanceOf(UserNotFoundError)
  })

  it('resets password and deletes token', async () => {
    tokenRepo.tokens.push({
      id: '1',
      token: 'abc',
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60),
    })

    await service.execute({ token: 'abc', password: 'newpass' })

    expect(await compare('newpass', userRepo.items[0].password)).toBe(true)
    expect(tokenRepo.tokens).toHaveLength(0)
  })
})
