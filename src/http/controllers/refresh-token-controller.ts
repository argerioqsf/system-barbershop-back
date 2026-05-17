import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { generateAuthTokens } from './auth/utils/generate-auth-tokens'
import { UserToken } from './auth/user-token'
import { TOKEN_EXPIRED_MESSAGE } from './auth/constants'

export const refreshTokenController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    refreshToken: z.string(),
  })

  const { refreshToken } = bodySchema.parse(request.body)

  let payload: UserToken
  try {
    payload = request.server.jwt.verify<UserToken>(refreshToken)
  } catch {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  if (payload.tokenType && payload.tokenType !== 'refresh') {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const usersRepository = new PrismaUsersRepository()
  const user = await usersRepository.findById(payload.sub)

  if (!user || !user.active) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const versionMismatch =
    !payload.versionToken || payload.versionToken < user.versionToken

  if (versionMismatch) {
    return reply.status(401).send({ message: TOKEN_EXPIRED_MESSAGE })
  }

  const tokens = await generateAuthTokens(reply, user)

  return reply.status(200).send({
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    tokenExpiresIn: tokens.tokenExpiresIn,
    refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
  })
}
