import { UserNotFoundError } from '@/services/@errors/user-not-found-error'
import { makeGetUserService } from '@/services/@factories/user/get-user-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
})

export async function getUser(request: FastifyRequest, reply: FastifyReply) {
  const { id } = routeSchema.parse(request.params)

  const getUserService = makeGetUserService()

  try {
    const { user } = await getUserService.execute({ id })

    return reply.status(200).send(user)
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
