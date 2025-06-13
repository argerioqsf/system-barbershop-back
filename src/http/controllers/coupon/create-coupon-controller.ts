import { makeCreateCouponService } from '@/services/@factories/coupon/make-create-coupon'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export async function CreateCouponController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    code: z.string(),
    description: z.string().optional(),
    discount: z.number(),
    discountType: z.enum(['PERCENTAGE', 'VALUE']).default('PERCENTAGE'),
    imageUrl: z.string().optional(),
    quantity: z.number().optional(),
  })
  const data = bodySchema.parse(request.body)
  const service = makeCreateCouponService()
  const unitId = (request.user as UserToken).unitId
  const { coupon } = await service.execute({ ...data, unitId })
  return reply.status(201).send(coupon)
}
