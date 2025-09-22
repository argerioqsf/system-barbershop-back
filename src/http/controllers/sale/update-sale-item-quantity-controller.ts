import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeSaleItemCoordinator } from '@/modules/sale/infra/factories/make-sale-item-coordinator'

export const UpdateSaleItemQuantityController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    quantity: z.number(),
  })

  const { id } = paramsSchema.parse(request.params)
  const { quantity } = bodySchema.parse(request.body)

  const coordinator = makeSaleItemCoordinator()
  const performedBy = request.user.sub
  const { sale, saleItems } = await coordinator.updateQuantity({
    saleItemId: id,
    quantity,
    performedBy,
  })

  return reply.status(200).send({ sale, saleItems })
}
