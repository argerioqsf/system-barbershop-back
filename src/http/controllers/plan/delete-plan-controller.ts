import { makeDeletePlanService } from '@/services/@factories/plan/make-delete-plan'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const DeletePlanController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeDeletePlanService()
  await service.execute({ id })
  return reply.status(204).send()
}
