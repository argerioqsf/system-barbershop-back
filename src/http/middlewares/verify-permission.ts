import { FastifyReply, FastifyRequest } from 'fastify'
import { Feature, assertPermission } from '@/utils/permissions'
import { UserToken } from '../controllers/authenticate-controller'
import { getProfileFromUserIdService } from '@/services/@factories/profile/get-profile-from-userId-service'

export function verifyPermission(feature: Feature) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserToken
    const getProfileFromUserId = getProfileFromUserIdService()
    const { profile } = await getProfileFromUserId.execute({ id: user.sub })
    const permissions = profile.permissions.map((p) => p.name)
    try {
      assertPermission(permissions, feature)
    } catch {
      return reply.status(403).send({ message: 'Unauthorized' })
    }
  }
}
