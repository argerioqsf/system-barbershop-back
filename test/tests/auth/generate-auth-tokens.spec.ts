import { describe, it, expect, vi } from 'vitest'
import { FastifyReply } from 'fastify'
import { generateAuthTokens } from '../../../src/http/controllers/auth/utils/generate-auth-tokens'
import { makeProfile } from '../../factories/make-profile.factory'
import { defaultUser } from '../../helpers/default-values'
import { User } from '@prisma/client'
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  REFRESH_TOKEN_EXPIRES_IN_SECONDS,
} from '../../../src/http/controllers/auth/constants'

describe('generateAuthTokens', () => {
  it('signs access and refresh tokens with the correct token types', async () => {
    const profile = makeProfile({ userId: defaultUser.id })
    const { password: _password, ...userWithoutPassword } = defaultUser
    const user = {
      ...userWithoutPassword,
      profile,
    } as Omit<User, 'password'> & {
      profile: typeof profile
    }

    const signedPayloads: Array<Record<string, unknown>> = []
    const reply = {
      jwtSign: vi.fn(async (payload: Record<string, unknown>) => {
        signedPayloads.push(payload)
        return JSON.stringify(payload)
      }),
    } as unknown as FastifyReply

    const tokens = await generateAuthTokens(reply, user)

    expect(tokens.token).toContain('"tokenType":"access"')
    expect(tokens.refreshToken).toContain('"tokenType":"refresh"')
    expect(signedPayloads).toHaveLength(2)
    expect(signedPayloads[0].tokenType).toBe('access')
    expect(signedPayloads[1].tokenType).toBe('refresh')
    expect(tokens.tokenExpiresIn).toBe(ACCESS_TOKEN_EXPIRES_IN_SECONDS)
    expect(tokens.refreshTokenExpiresIn).toBe(REFRESH_TOKEN_EXPIRES_IN_SECONDS)
  })
})
