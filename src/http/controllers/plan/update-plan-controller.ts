import { makeUpdatePlanService } from '@/services/@factories/plan/make-update-plan'
import { makeGetPlanService } from '@/services/@factories/plan/make-get-plan'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const UpdatePlanController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    name: z.string().optional(),
    price: z.number().optional(),
    typeRecurrenceId: z.string().optional(),
    benefitIds: z.array(z.string()).optional(),
    unitId: z.string().optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const user = request.user as UserToken

  const getPlanService = makeGetPlanService()
  const existing = await getPlanService.execute({ id })
  if (!existing.plan) {
    return reply.status(404).send({ message: 'Plan not found' })
  }
  if (existing.plan.unitId !== user.unitId && user.role !== 'ADMIN') {
    return reply
      .status(403)
      .send({ message: 'Plan not available for this unit' })
  }

  const targetUnitId =
    user.role === 'ADMIN' && data.unitId ? data.unitId : existing.plan.unitId

  const service = makeUpdatePlanService()
  const { plan } = await service.execute({
    id,
    data: {
      name: data.name,
      price: data.price,
      typeRecurrence: data.typeRecurrenceId
        ? { connect: { id: data.typeRecurrenceId } }
        : undefined,
      ...(targetUnitId !== existing.plan.unitId
        ? { unit: { connect: { id: targetUnitId } } }
        : undefined),
    },
    benefitIds: data.benefitIds,
  })
  return reply.status(200).send(plan)
}
