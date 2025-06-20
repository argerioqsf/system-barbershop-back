import { makeListPermissionsService } from '@/services/@factories/permission/make-list-permissions'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'

export const ListPermissionController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const user = request.user as UserToken
  const service = makeListPermissionsService()
  const { permissions } = await service.execute(user)
  return reply.status(200).send(permissions)
}
