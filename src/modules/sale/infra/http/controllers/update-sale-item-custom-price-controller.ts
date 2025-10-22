import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeSaleItemCoordinator } from '@/modules/sale/infra/factories/make-sale-item-coordinator'

export const UpdateSaleItemCustomPriceController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    customPrice: z.number().nullable().optional(),
  })

  const { id } = paramsSchema.parse(request.params)
  const { customPrice } = bodySchema.parse(request.body)

  const coordinator = makeSaleItemCoordinator()
  const performedBy = request.user.sub
  const { sale, saleItems } = await coordinator.updateCustomPrice({
    saleItemId: id,
    customPrice,
    performedBy,
  })

  return reply.status(200).send({ sale, saleItems })
}
