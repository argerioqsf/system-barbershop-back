import { makeUpdateTypeRecurrenceService } from '@/services/@factories/type-recurrence/make-update-type-recurrence'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const UpdateTypeRecurrenceController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({ period: z.number().optional() })
  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const service = makeUpdateTypeRecurrenceService()
  const { typeRecurrence } = await service.execute({ id, data })
  return reply.status(200).send(typeRecurrence)
}
