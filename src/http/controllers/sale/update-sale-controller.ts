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
  })
  const { id } = paramsSchema.parse(request.params)
  const { observation, method, paymentStatus } = bodySchema.parse(request.body)
  const service = makeUpdateSale()
  const { sale } = await service.execute({
    id,
    data: {
      observation,
      method,
      paymentStatus,
    },
  })
  return reply.status(200).send(sale)
}
