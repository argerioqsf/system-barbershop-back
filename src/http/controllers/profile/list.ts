import { InvalidCredentialsError } from '@/services/@errors/invalid-credentials-error'
import { getProfileFromUserIdService } from '@/services/@factories/profile/get-profile-from-userId-service'

import { Role } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function List(request: FastifyRequest, replay: FastifyReply) {
  try {
    const getProfileFromUserId = getProfileFromUserIdService()
    const userId = request.user.sub
    const { profile } = await getProfileFromUserId.execute({
      id: userId,
    })
    const { user, ...profileWithoutUser } = profile

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user
    return replay.status(200).send({
      profile: {
        ...profileWithoutUser,
        ...userWithoutPassword,
      },
      roles: Role,
    })
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return replay.status(404).send({ message: error.message })
    }

    console.error(error)

    return replay.status(500).send({ message: 'Internal server error' })
  }
}
