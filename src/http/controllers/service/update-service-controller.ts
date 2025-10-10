import { makeUpdateService } from '@/services/@factories/service/make-update-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const UpdateServiceController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    cost: z.coerce.number().optional(),
    price: z.coerce.number().optional(),
    commissionPercentage: z.coerce.number().optional(),
    categoryId: z.string().optional(),
    defaultTime: z.coerce.number().optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const service = makeUpdateService()
  const { service: updatedService } = await service.execute({ id, data })
  return reply.status(200).send(updatedService)
}
