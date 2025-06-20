import { makeListRolesService } from '@/services/@factories/role/make-list-roles'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'
import { getProfileFromUserIdService } from '@/services/@factories/profile/get-profile-from-userId-service'

export const ListRoleController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const user = request.user as UserToken
  const service = makeListRolesService()
  const getProfileFromUserId = getProfileFromUserIdService()
  const { profile } = await getProfileFromUserId.execute({ id: user.sub })
  const permissions = profile.permissions.map((p) => p.name)
  const { roles } = await service.execute({ ...user, permissions })
  return reply.status(200).send(roles)
}
