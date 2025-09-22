import { makeListUserSoldProductsService } from '@/modules/finance/infra/factories/make-list-user-sold-products'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const GetUserProductsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ userId: z.string() })
  const { userId } = paramsSchema.parse(request.params)
  const service = makeListUserSoldProductsService()
  const { items } = await service.execute({ userId })
  return reply.status(200).send(items)
}
