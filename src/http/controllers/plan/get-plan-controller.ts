import { makeGetPlanService } from '@/services/@factories/plan/make-get-plan'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const GetPlanController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeGetPlanService()
  const { plan } = await service.execute({ id })
  if (!plan) {
    return reply.status(404).send({ message: 'Plan not found' })
  }
  const user = request.user as UserToken
  if (plan.unitId !== user.unitId && user.role !== 'ADMIN') {
    return reply
      .status(403)
      .send({ message: 'Plan not available for this unit' })
  }
  return reply.status(200).send(plan)
}
