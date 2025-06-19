import { FastifyReply, FastifyRequest } from 'fastify'
import { Feature, assertPermission } from '@/utils/permissions'
import { UserToken } from '../controllers/authenticate-controller'

export function verifyPermission(feature: Feature) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserToken
    try {
      assertPermission(user.role, feature)
    } catch {
      return reply.status(403).send({ message: 'Unauthorized' })
    }
  }
}
