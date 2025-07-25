import { makeCreateTypeRecurrenceService } from '@/services/@factories/type-recurrence/make-create-type-recurrence'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const CreateTypeRecurrenceController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({ period: z.number() })
  const data = bodySchema.parse(request.body)
  const service = makeCreateTypeRecurrenceService()
  const { typeRecurrence } = await service.execute(data)
  return reply.status(201).send({ typeRecurrence })
}
