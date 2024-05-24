import { InvalidCredentialsError } from '@/services/@errors/invalid-credentials-error'
import { getProfileFromUserIdService } from '@/services/@factories/profile/get-profile-from-userId-service'

import { Role } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function GetProfile(
  request: FastifyRequest,
  replay: FastifyReply,
) {
  try {
    const getProfileFromUserId = getProfileFromUserIdService()
    const userId = request.user.sub
    const { profile } = await getProfileFromUserId.execute({
      id: userId,
    })
    return replay.status(200).send({
      profile,
      roles: Role,
    })
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return replay.status(404).send({ message: error.message })
    }

    return replay.status(500).send({ message: 'Internal server error' })
  }
}
