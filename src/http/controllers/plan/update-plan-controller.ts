import { makeUpdatePlanService } from '@/services/@factories/plan/make-update-plan'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const UpdatePlanController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    name: z.string().optional(),
    price: z.number().optional(),
    typeRecurrenceId: z.string().optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const service = makeUpdatePlanService()
  const { plan } = await service.execute({
    id,
    data: {
      name: data.name,
      price: data.price,
      typeRecurrence: data.typeRecurrenceId
        ? { connect: { id: data.typeRecurrenceId } }
        : undefined,
    },
  })
  return reply.status(200).send(plan)
}
