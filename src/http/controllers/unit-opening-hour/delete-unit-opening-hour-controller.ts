import { makeDeleteUnitOpeningHourService } from '@/services/@factories/unit/make-delete-unit-opening-hour-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const DeleteUnitOpeningHourController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeDeleteUnitOpeningHourService()
  await service.execute({ id })
  return reply.status(204).send()
}
