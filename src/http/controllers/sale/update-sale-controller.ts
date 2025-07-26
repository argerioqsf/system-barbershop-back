import { makeUpdateSale } from '@/services/@factories/sale/make-update-sale'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { PaymentMethod } from '@prisma/client'

export const UpdateSaleController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    observation: z.string().optional(),
    method: z.nativeEnum(PaymentMethod).optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const { observation, method } = bodySchema.parse(request.body)
  const service = makeUpdateSale()
  const { sale } = await service.execute({
    id,
    observation,
    method,
  })
  return reply.status(200).send(sale)
}
