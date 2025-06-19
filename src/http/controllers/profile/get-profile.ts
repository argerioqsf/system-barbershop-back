import { getProfileFromUserIdService } from '@/services/@factories/profile/get-profile-from-userId-service'

import { Role } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'
import { handleControllerError } from '@/utils/http-error-handler'

export async function GetProfile(
  request: FastifyRequest,
  replay: FastifyReply,
) {
  try {
    const getProfileFromUserId = getProfileFromUserIdService()
    const userId = request.user.sub
    const { profile } = await getProfileFromUserId.execute({ id: userId })

    return replay.status(200).send({
      profile,
      roles: Role,
    })
  } catch (error) {
    return handleControllerError(error, replay)
  }
}
