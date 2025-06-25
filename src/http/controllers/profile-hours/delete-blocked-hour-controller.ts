import { makeDeleteProfileBlockedHourService } from '@/services/@factories/profile/make-delete-profile-blocked-hour-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const DeleteBlockedHourController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeDeleteProfileBlockedHourService()
  await service.execute({ id })
  return reply.status(204).send()
}
