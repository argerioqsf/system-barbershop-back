import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeSaleItemCoordinator } from '@/modules/sale/infra/factories/make-sale-item-coordinator'
import { UserToken } from '../authenticate-controller'

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
  const performedBy = (request.user as UserToken | undefined)?.sub
  const coordinator = makeSaleItemCoordinator()
  const { sale, saleItems } = await coordinator.updateCoupon({
    saleItemId: id,
    couponId,
    couponCode,
    performedBy,
  })
  return reply.status(200).send({ sale, saleItems })
}
