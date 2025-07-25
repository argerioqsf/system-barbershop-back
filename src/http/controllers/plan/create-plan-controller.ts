import { makeCreatePlanService } from '@/services/@factories/plan/make-create-plan'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const CreatePlanController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    name: z.string(),
    price: z.number(),
    typeRecurrenceId: z.string(),
  })
  const data = bodySchema.parse(request.body)
  const service = makeCreatePlanService()
  const { plan } = await service.execute(data)
  return reply.status(201).send({ plan })
}
