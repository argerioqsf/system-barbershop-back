import { makeCancelPlanProfile } from '@/services/@factories/plan/make-cancel-plan-profile'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const CancelPlanProfileController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeCancelPlanProfile()
  const { planProfile } = await service.execute({ id })
  return reply.status(200).send(planProfile)
}
