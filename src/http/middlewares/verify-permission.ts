import { FastifyReply, FastifyRequest } from 'fastify'
import { assertPermission } from '@/utils/permissions'
import { UserToken } from '../controllers/authenticate-controller'
import { PermissionName } from '@prisma/client'

export function verifyPermission(permissions: PermissionName[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserToken
    try {
      await assertPermission(permissions, user.permissions)
    } catch {
      return reply.status(403).send({ message: 'Unauthorized' })
    }
  }
}
