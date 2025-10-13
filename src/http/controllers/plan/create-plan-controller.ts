import { makeCreatePlanService } from '@/services/@factories/plan/make-create-plan'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const CreatePlanController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    name: z.string(),
    price: z.number(),
    typeRecurrenceId: z.string(),
    benefitIds: z.array(z.string()).optional(),
    unitId: z.string().optional(),
  })
  const data = bodySchema.parse(request.body)
  const service = makeCreatePlanService()
  const user = request.user as UserToken
  const unitId =
    user.role === 'ADMIN' ? data.unitId ?? user.unitId : user.unitId
  const { plan } = await service.execute({
    name: data.name,
    price: data.price,
    typeRecurrenceId: data.typeRecurrenceId,
    benefitIds: data.benefitIds,
    unitId,
  })
  return reply.status(201).send({ plan })
}
