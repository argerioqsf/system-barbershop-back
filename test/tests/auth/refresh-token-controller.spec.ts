import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { refreshTokenController } from '../../../src/http/controllers/refresh-token-controller'
import { PrismaUsersRepository } from '../../../src/repositories/prisma/prisma-users-repository'
import { defaultUser } from '../../helpers/default-values'
import { makeProfile } from '../../factories/make-profile.factory'
import { FastifyReply, FastifyRequest } from 'fastify'
import { RoleName, User } from '@prisma/client'
import { UserToken } from '../../../src/http/controllers/auth/user-token'
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  REFRESH_TOKEN_EXPIRES_IN_SECONDS,
  TOKEN_EXPIRED_MESSAGE,
} from '../../../src/http/controllers/auth/constants'

function createUser() {
  const profile = makeProfile({ userId: defaultUser.id })
  const { password: _password, ...userWithoutPassword } = defaultUser

  return {
    ...userWithoutPassword,
    profile,
  } as Omit<User, 'password'> & { profile: typeof profile }
}

function createReply() {
  const reply = {} as FastifyReply
  const send = vi.fn().mockReturnValue(reply)
  const status = vi.fn().mockReturnValue(reply)
  const jwtSign = vi.fn(async (payload: Record<string, unknown>) =>
    JSON.stringify(payload),
  )
  Object.assign(reply, { send, status, jwtSign })

  return { reply, send, status, jwtSign }
}

function createRequest(payload: Partial<UserToken>) {
  const verify = vi.fn().mockReturnValue({
    sub: 'user-1',
    unitId: 'unit-1',
    organizationId: 'org-1',
    role: RoleName.ADMIN,
    versionToken: 1,
    tokenType: 'refresh',
    ...payload,
  })

  return {
    body: { refreshToken: 'any-refresh-token' },
    server: {
      jwt: {
        verify,
      },
    },
  } as FastifyRequest & { server: { jwt: { verify: typeof verify } } }
}

describe('refreshTokenController', () => {
  let findByIdSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    findByIdSpy = vi.spyOn(
      PrismaUsersRepository.prototype,
      'findById',
    ) as ReturnType<typeof vi.spyOn>
  })

  afterEach(() => {
    findByIdSpy.mockRestore()
  })

  it('issues new tokens when refresh token is valid', async () => {
    const user = createUser()
    findByIdSpy.mockResolvedValue(user)
    const { reply, send, status } = createReply()
    const request = createRequest({ sub: user.id, tokenType: 'refresh' })

    await refreshTokenController(request, reply)

    expect(status).toHaveBeenCalledWith(200)
    expect(send).toHaveBeenCalledWith({
      token: expect.any(String),
      refreshToken: expect.any(String),
      tokenExpiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      refreshTokenExpiresIn: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
    })
    expect(reply.jwtSign).toHaveBeenCalledTimes(2)
  })

  it('rejects tokens that are not marked as refresh tokens', async () => {
    const { reply, send, status } = createReply()
    const request = createRequest({ tokenType: 'access' })

    await refreshTokenController(request, reply)

    expect(status).toHaveBeenCalledWith(401)
    expect(send).toHaveBeenCalledWith({ message: 'Unauthorized' })
    expect(findByIdSpy).not.toHaveBeenCalled()
  })

  it('fails when refresh token version is outdated', async () => {
    const { reply, send, status } = createReply()
    const request = createRequest({ versionToken: 1 })
    const user = createUser()
    user.versionToken = 2
    findByIdSpy.mockResolvedValue(user)

    await refreshTokenController(request, reply)

    expect(status).toHaveBeenCalledWith(401)
    expect(send).toHaveBeenCalledWith({ message: TOKEN_EXPIRED_MESSAGE })
  })
})
