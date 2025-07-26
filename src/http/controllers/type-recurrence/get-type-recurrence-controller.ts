import { makeGetTypeRecurrenceService } from '@/services/@factories/type-recurrence/make-get-type-recurrence'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const GetTypeRecurrenceController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeGetTypeRecurrenceService()
  const { typeRecurrence } = await service.execute({ id })
  return reply.status(200).send(typeRecurrence)
}
