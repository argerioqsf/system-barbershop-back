import { makeRenewPlanProfileService } from '@/services/@factories/plan/make-renew-plan-profile'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const RenewPlanProfileController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeRenewPlanProfileService()
  const { planProfile } = await service.execute({ id })
  return reply.status(200).send(planProfile)
}
