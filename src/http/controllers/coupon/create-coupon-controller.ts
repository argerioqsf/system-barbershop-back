import { withErrorHandling } from '@/utils/http-error-handler'
import { makeCreateCouponService } from '@/services/@factories/coupon/make-create-coupon'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const CreateCouponController = withErrorHandling(async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
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
  const { coupon } = await service.execute({
    code: data.code,
    description: data.description,
    discount: data.discount,
    discountType: data.discountType,
    imageUrl: data.imageUrl,
    quantity: data.quantity,
    unitId,
  })
  return reply.status(201).send(coupon)
})
