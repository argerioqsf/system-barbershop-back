import { makeDeleteCouponService } from '@/services/@factories/coupon/make-delete-coupon'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const DeleteCouponController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeDeleteCouponService()
  await service.execute({ id })
  return reply.status(204).send()
}
