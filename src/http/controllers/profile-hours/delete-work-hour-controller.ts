import { makeDeleteProfileWorkHourService } from '@/services/@factories/profile/make-delete-profile-work-hour-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const DeleteWorkHourController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeDeleteProfileWorkHourService()
  await service.execute({ id })
  return reply.status(204).send()
}
