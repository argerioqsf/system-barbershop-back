import { SegmentNotFoundError } from '@/services/@errors/segment-not-found-error'
import { makeDeleteUnitSegmentService } from '@/services/@factories/units/make-delete-unit-segment-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const routeSchema = z.object({
  unitId: z.string(),
  segmentId: z.string(),
})

export async function deleteUnitSegment(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { unitId, segmentId } = routeSchema.parse(request.params)

  const deleteUnitSegmentService = makeDeleteUnitSegmentService()

  try {
    const { unitSegment } = await deleteUnitSegmentService.execute({
      unitId,
      segmentId,
    })

    return reply
      .status(200)
      .send({ message: 'unit segment deleted', unitSegment })
  } catch (error) {
    if (error instanceof SegmentNotFoundError) {
      return reply.status(404).send({ message: error.message })
    }

    return reply.status(500).send({ message: 'Internal server error' })
  }
}
