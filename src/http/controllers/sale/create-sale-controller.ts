import { makeCreateSale } from '@/services/@factories/sale/make-create-sale'
import { PaymentMethod, PaymentStatus } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const CreateSaleController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    method: z.nativeEnum(PaymentMethod),
    items: z.array(
      z.object({
        serviceId: z.string().optional(),
        productId: z.string().optional(),
        appointmentId: z.string().optional(),
        quantity: z.number().min(1),
        barberId: z.string().optional(),
        couponCode: z.string().optional(),
        price: z.number().optional(),
      }),
    ),
    clientId: z.string(),
    couponCode: z.string().optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional().default('PENDING'),
  })
  const data = bodySchema.parse(request.body)
  const userId = request.user.sub
  const service = makeCreateSale()
  const { sale } = await service.execute({
    method: data.method,
    items: data.items,
    clientId: data.clientId,
    couponCode: data.couponCode,
    paymentStatus: data.paymentStatus,
    userId,
  })
  return reply.status(201).send(sale)
}
