import { SegmentNotFoundError } from '@/services/@errors/segment-not-found-error'
import { makeGetSegmentService } from '@/services/@factories/segments/make-get-segment-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
})

export async function getSegment(request: FastifyRequest, reply: FastifyReply) {
  const { id } = routeSchema.parse(request.params)

  const getSegmentService = makeGetSegmentService()

  try {
    const { segment } = await getSegmentService.execute({ id })

    return reply.status(200).send({ segment })
  } catch (error) {
    if (error instanceof SegmentNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
