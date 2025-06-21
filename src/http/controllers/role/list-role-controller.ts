import { makeListRolesService } from '@/services/@factories/role/make-list-roles'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'

export const ListRoleController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const user = request.user as UserToken
  const service = makeListRolesService()
  const { roles } = await service.execute(user)
  return reply.status(200).send(roles)
}
