import { UserNotFoundError } from '@/services/@errors/user-not-found-error'
import { makeUpdateActiveIndicatorService } from '@/services/@factories/indicator/make-update-active-indicator-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const bodySchema = z.object({
  active: z.boolean(),
})

const routeSchema = z.object({
  id: z.string(),
})

export async function UpdateActive(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { active } = bodySchema.parse(request.body)

  const updateActiveIndicatorService = makeUpdateActiveIndicatorService()

  const { id } = routeSchema.parse(request.params)

  try {
    const { user } = await updateActiveIndicatorService.execute({
      id,
      active,
    })
    return reply
      .status(201)
      .send(
        user && user.active ? { msg: 'user active' } : { msg: 'user inactive' },
      )
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
