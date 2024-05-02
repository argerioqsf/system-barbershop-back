import { SegmentNotFoundError } from '@/services/@errors/segment-not-found-error'
import { makeDeleteSegmentService } from '@/services/@factories/segments/make-delete-segment-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  id: z.string(),
})

export async function deleteSegment(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = routeSchema.parse(request.params)

  const deleteSegmentService = makeDeleteSegmentService()

  try {
    const { segment } = await deleteSegmentService.execute({ id })

    return reply.status(200).send({ message: 'segment deleted', segment })
  } catch (error) {
    if (error instanceof SegmentNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
