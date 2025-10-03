import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeSaleItemCoordinator } from '@/modules/sale/infra/factories/make-sale-item-coordinator'

export const UpdateSaleItemController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    serviceId: z.string().optional().nullable(),
    productId: z.string().optional().nullable(),
    appointmentId: z.string().optional().nullable(),
    planId: z.string().optional().nullable(),
    quantity: z.number().optional(),
    barberId: z.string().optional().nullable(),
    couponId: z.string().optional().nullable(),
    couponCode: z.string().optional().nullable(),
    customPrice: z.number().optional().nullable(),
  })
  const { id } = paramsSchema.parse(request.params)
  const {
    serviceId,
    productId,
    appointmentId,
    planId,
    quantity,
    barberId,
    couponId,
    couponCode,
    customPrice,
  } = bodySchema.parse(request.body)
  const coordinator = makeSaleItemCoordinator()
  const performedBy = request.user.sub

  let result: Awaited<ReturnType<typeof coordinator.updateCoupon>> | undefined

  const hasDetailsChange =
    serviceId !== undefined ||
    productId !== undefined ||
    appointmentId !== undefined ||
    planId !== undefined

  if (hasDetailsChange) {
    result = await coordinator.updateDetails({
      saleItemId: id,
      serviceId: serviceId ?? undefined,
      productId: productId ?? undefined,
      appointmentId: appointmentId ?? undefined,
      planId: planId ?? undefined,
      quantity,
      performedBy,
    })
  }

  const quantityHandled = hasDetailsChange && quantity !== undefined

  if (quantity !== undefined && !quantityHandled) {
    result = await coordinator.updateQuantity({
      saleItemId: id,
      quantity,
      performedBy,
    })
  }

  if (customPrice !== undefined) {
    result = await coordinator.updateCustomPrice({
      saleItemId: id,
      customPrice,
      performedBy,
    })
  }

  if (couponId !== undefined || couponCode !== undefined) {
    result = await coordinator.updateCoupon({
      saleItemId: id,
      couponId: couponId ?? undefined,
      couponCode: couponCode ?? undefined,
      performedBy,
    })
  }

  if (barberId !== undefined) {
    result = await coordinator.updateBarber({
      saleItemId: id,
      barberId,
      performedBy,
    })
  }

  if (!result) {
    throw new Error('No sale item changes provided')
  }

  return reply
    .status(200)
    .send({ sale: result.sale, saleItems: result.saleItems })
}
