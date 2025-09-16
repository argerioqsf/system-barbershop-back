import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeUpdateCouponSale } from '@/services/@factories/sale/make-update-coupon-sale'
import { PrismaCouponRepository } from '@/repositories/prisma/prisma-coupon-repository'

export const UpdateCouponSaleController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    couponCode: z.string().optional(),
    couponId: z.string().optional(), // deprecated: manter compatibilidade
    removeCoupon: z.boolean().optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const {
    couponCode,
    couponId: couponIdBody,
    removeCoupon,
  } = bodySchema.parse(request.body)
  let couponId = couponIdBody

  if (couponCode) {
    const couponRepo = new PrismaCouponRepository()
    const coupon = await couponRepo.findByCode(couponCode)
    if (!coupon) {
      return reply.status(404).send({ message: 'Coupon not found' })
    }
    couponId = coupon.id
  }
  const service = makeUpdateCouponSale()
  const { sale } = await service.execute({
    id,
    couponId,
    removeCoupon,
  })
  return reply.status(200).send(sale)
}
