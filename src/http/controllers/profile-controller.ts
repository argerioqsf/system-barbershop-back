import { makeProfileService } from '@/services/factories/make-profile-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
})

export async function profile(request: FastifyRequest, replay: FastifyReply) {
  const getUserProfile = makeProfileService()

  const { id } = routeSchema.parse(request.params)

  const { profile } = await getUserProfile.execute({
    id,
  })

  return replay.status(200).send({
    profile: {
      ...profile,
      password: undefined,
    },
  })
}
