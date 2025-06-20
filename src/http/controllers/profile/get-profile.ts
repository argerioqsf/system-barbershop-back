import { getProfileFromUserIdService } from '@/services/@factories/profile/get-profile-from-userId-service'

import { RoleName } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'

export const GetProfile = async (
  request: FastifyRequest,
  replay: FastifyReply,
) => {
  const getProfileFromUserId = getProfileFromUserIdService()
  const userId = request.user.sub
  const { profile } = await getProfileFromUserId.execute({ id: userId })

  const roles = Object.values(RoleName) as readonly RoleName[]
  return replay.status(200).send({
    profile,
    roles,
  })
}
