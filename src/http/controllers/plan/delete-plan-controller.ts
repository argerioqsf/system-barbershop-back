import { makeDeletePlanService } from '@/services/@factories/plan/make-delete-plan'
import { makeGetPlanService } from '@/services/@factories/plan/make-get-plan'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const DeletePlanController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const user = request.user as UserToken

  const getPlanService = makeGetPlanService()
  const { plan } = await getPlanService.execute({ id })
  if (!plan) {
    return reply.status(404).send({ message: 'Plan not found' })
  }
  if (plan.unitId !== user.unitId && user.role !== 'ADMIN') {
    return reply
      .status(403)
      .send({ message: 'Plan not available for this unit' })
  }

  const service = makeDeletePlanService()
  await service.execute({ id })
  return reply.status(204).send()
}
