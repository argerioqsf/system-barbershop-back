import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../controllers/authenticate-controller'
import { TOKEN_EXPIRED_MESSAGE } from '../controllers/auth/constants'

type FastifyJwtError = Error & { code?: string }

function isTokenExpiredError(error: unknown): error is FastifyJwtError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as FastifyJwtError).code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED'
  )
}

export async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    const token = request.user as UserToken

    if (token.tokenType && token.tokenType !== 'access') {
      return reply.status(401).send({ message: 'Unauthorized' })
    }
  } catch (error) {
    if (isTokenExpiredError(error)) {
      return reply.status(401).send({ message: TOKEN_EXPIRED_MESSAGE })
    }

    return reply.status(401).send({ message: 'Unauthorized' })
  }
}
