import { makeAuthenticateService } from '@/services/@factories/make-authenticate-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { RoleName } from '@prisma/client'
import { z } from 'zod'
import { generateAuthTokens } from './auth/utils/generate-auth-tokens'

export { UserToken } from './auth/user-token'

export const authenticate = async (
  request: FastifyRequest,
  replay: FastifyReply,
) => {
  const authenticateBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  })

  const { email, password } = authenticateBodySchema.parse(request.body)

  const authenticateService = makeAuthenticateService()

  const { user } = await authenticateService.execute({
    email,
    password,
  })
  const { token, refreshToken, tokenExpiresIn, refreshTokenExpiresIn } =
    await generateAuthTokens(replay, user)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userWithoutPassword } = user
  const Roles = Object.values(RoleName) as readonly RoleName[]
  return replay.status(200).send({
    user: userWithoutPassword,
    roles: Roles,
    token,
    refreshToken,
    tokenExpiresIn,
    refreshTokenExpiresIn,
  })
}
