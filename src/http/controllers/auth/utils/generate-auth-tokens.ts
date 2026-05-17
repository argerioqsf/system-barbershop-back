import { FastifyReply } from 'fastify'
import { Permission, Profile, Role, RoleName, User } from '@prisma/client'
import { UserToken } from '../user-token'
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  REFRESH_TOKEN_EXPIRES_IN_SECONDS,
} from '../constants'

type AuthUser = Omit<User, 'password'> & {
  profile: (Profile & { role: Role; permissions: Permission[] }) | null
}

interface AuthTokens {
  token: string
  refreshToken: string
  payload: Omit<UserToken, 'tokenType'>
  tokenExpiresIn: number
  refreshTokenExpiresIn: number
}

export async function generateAuthTokens(
  reply: FastifyReply,
  user: AuthUser,
): Promise<AuthTokens> {
  const permissions = user.profile?.permissions.map(
    (permission) => permission.name,
  )
  const payload: Omit<UserToken, 'tokenType'> = {
    sub: user.id,
    unitId: user.unitId,
    organizationId: user.organizationId,
    role: user.profile?.role?.name as RoleName,
    permissions,
    versionToken: user.versionToken,
  }

  const [token, refreshToken] = await Promise.all([
    reply.jwtSign(
      { ...payload, tokenType: 'access' },
      { sign: { sub: user.id, expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS } },
    ),
    reply.jwtSign(
      { ...payload, tokenType: 'refresh' },
      { sign: { sub: user.id, expiresIn: REFRESH_TOKEN_EXPIRES_IN_SECONDS } },
    ),
  ])

  return {
    token,
    refreshToken,
    payload,
    tokenExpiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    refreshTokenExpiresIn: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
  }
}
