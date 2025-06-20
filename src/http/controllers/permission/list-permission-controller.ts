import { makeListPermissionsService } from '@/services/@factories/permission/make-list-permissions'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'
import { getProfileFromUserIdService } from '@/services/@factories/profile/get-profile-from-userId-service'

export const ListPermissionController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const user = request.user as UserToken
  const service = makeListPermissionsService()
  const getProfileFromUserId = getProfileFromUserIdService()
  const { profile } = await getProfileFromUserId.execute({ id: user.sub })
  const permissionsList = profile.permissions.map((p) => p.name)
  const { permissions } = await service.execute({ ...user, permissions: permissionsList })
  return reply.status(200).send(permissions)
}
