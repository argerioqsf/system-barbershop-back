import { makeDeleteTypeRecurrenceService } from '@/services/@factories/type-recurrence/make-delete-type-recurrence'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const DeleteTypeRecurrenceController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeDeleteTypeRecurrenceService()
  await service.execute({ id })
  return reply.status(204).send()
}
