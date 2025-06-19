import { makeDeleteUnitService } from '@/services/@factories/unit/make-delete-unit'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const DeleteUnitController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({
    id: z.string(),
  })
  const { id } = paramsSchema.parse(request.params)
  const service = makeDeleteUnitService()
  await service.execute(id)
  return reply.status(204).send()
}
