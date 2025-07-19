import { makeGetPlanService } from '@/services/@factories/plan/make-get-plan'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const GetPlanController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeGetPlanService()
  const { plan } = await service.execute({ id })
  return reply.status(200).send(plan)
}
