import { withErrorHandling } from '@/utils/http-error-handler'
import { makeGetCouponService } from '@/services/@factories/coupon/make-get-coupon'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const GetCouponController = withErrorHandling(
  async (request: FastifyRequest, reply: FastifyReply) => {
    const paramsSchema = z.object({ id: z.string() })
    const { id } = paramsSchema.parse(request.params)
    const service = makeGetCouponService()
    const { coupon } = await service.execute({ id })
    if (!coupon) return reply.status(404).send({ message: 'Coupon not found' })
    return reply.status(200).send(coupon)
  },
)
