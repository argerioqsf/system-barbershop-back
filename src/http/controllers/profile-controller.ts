import { makeProfileService } from '@/services/factories/make-profile-service'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function profile(request: FastifyRequest, replay: FastifyReply) {
  const getUserProfile = makeProfileService()

  const { user } = await getUserProfile.execute({
    userId: request.user.sub,
  })

  return replay.status(200).send({
    user: {
      ...user,
      password: undefined,
    },
  })
}
