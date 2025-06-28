import { makeUpdateSale } from '@/services/@factories/sale/make-update-sale'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { PaymentMethod, PaymentStatus } from '@prisma/client'

export const UpdateSaleController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    observation: z.string().optional(),
    method: z.nativeEnum(PaymentMethod).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    items: z
      .array(
        z.object({
          serviceId: z.string().optional(),
          productId: z.string().optional(),
          appointmentId: z.string().optional(),
          quantity: z.number(),
          barberId: z.string().optional(),
          couponCode: z.string().optional(),
          price: z.number().optional(),
        }),
      )
      .optional(),
    removeItemIds: z.array(z.string()).optional(),
    couponCode: z.string().optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const {
    observation,
    method,
    paymentStatus,
    items,
    removeItemIds,
    couponCode,
  } = bodySchema.parse(request.body)
  const service = makeUpdateSale()
  const { sale } = await service.execute({
    id,
    observation,
    method,
    paymentStatus,
    items,
    removeItemIds,
    couponCode,
  })
  return reply.status(200).send(sale)
}
