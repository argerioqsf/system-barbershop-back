import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeUpdateCouponSaleItem } from '@/services/@factories/sale/make-update-coupon-sale-item'

export const UpdateCouponSaleItemController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    couponId: z.string().optional().nullable(),
    couponCode: z.string().optional().nullable(),
  })
  const { id } = paramsSchema.parse(request.params)
  const { couponId, couponCode } = bodySchema.parse(request.body)
  const service = makeUpdateCouponSaleItem()
  const { sale, saleItems } = await service.execute({
    id,
    saleItemUpdateFields: {
      couponId,
      couponCode,
    },
  })
  return reply.status(200).send({ sale, saleItems })
}
