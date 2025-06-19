import { withErrorHandling } from '@/utils/http-error-handler'
import { makeUpdateCouponService } from '@/services/@factories/coupon/make-update-coupon'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const UpdateCouponController = withErrorHandling(async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({ quantity: z.number() })
  const { id } = paramsSchema.parse(request.params)
  const { quantity } = bodySchema.parse(request.body)
  const service = makeUpdateCouponService()
  const { coupon } = await service.execute({ id, data: { quantity } })
  return reply.status(200).send(coupon)
})
