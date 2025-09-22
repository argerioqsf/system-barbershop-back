import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeRemoveAddSaleItem } from '@/modules/sale/infra/factories/make-remove-add-sale-item'

export const RemoveAddSaleItemController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    addItemsIds: z
      .array(
        z.object({
          serviceId: z.string().optional(),
          productId: z.string().optional(),
          appointmentId: z.string().optional(),
          planId: z.string().optional(),
          quantity: z.number(),
          barberId: z.string().optional(),
          couponId: z.string().optional(),
          customPrice: z.number().optional(),
        }),
      )
      .optional(),
    removeItemIds: z.array(z.string()).optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const { addItemsIds, removeItemIds } = bodySchema.parse(request.body)
  const performedBy = request.user.sub
  const service = makeRemoveAddSaleItem()
  const { sale } = await service.execute({
    id,
    addItemsIds,
    removeItemIds,
    performedBy,
  })
  return reply.status(200).send(sale)
}
