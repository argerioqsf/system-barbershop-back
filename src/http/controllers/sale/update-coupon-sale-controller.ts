import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeUpdateCouponSale } from '@/services/@factories/sale/make-update-coupon-sale'

export const UpdateCouponSaleController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    couponId: z.string().optional(),
    removeCoupon: z.boolean().optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const { couponId, removeCoupon } = bodySchema.parse(request.body)
  const service = makeUpdateCouponSale()
  const { sale } = await service.execute({
    id,
    couponId,
    removeCoupon,
  })
  return reply.status(200).send(sale)
}
