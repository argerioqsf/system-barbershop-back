import { makeCreateCouponService } from '@/services/@factories/coupon/make-create-coupon'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function CreateCouponController(request: FastifyRequest, reply: FastifyReply) {
  const bodySchema = z.object({
    code: z.string(),
    description: z.string().optional(),
    discount: z.number(),
    imageUrl: z.string().optional(),
  })
  const data = bodySchema.parse(request.body)
  const service = makeCreateCouponService()
  const { coupon } = await service.execute(data)
  return reply.status(201).send(coupon)
}
