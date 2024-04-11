import { IndicatorNotFoundError } from '@/services/@errors/indicator-not-found-error'
import { makeGetIndicatorService } from '@/services/@factories/indicator/make-get-indicator'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
})

export async function GetIndicatorProfile(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = routeSchema.parse(request.params)

  const getIndicator = makeGetIndicatorService()

  try {
    const { user } = await getIndicator.execute({ id })

    return reply.status(200).send(user)
  } catch (error) {
    if (error instanceof IndicatorNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
