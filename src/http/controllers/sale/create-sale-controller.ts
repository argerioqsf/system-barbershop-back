import { makeCreateSale } from '@/modules/sale/infra/factories/make-create-sale'
import { PaymentMethod } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const CreateSaleController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    method: z.nativeEnum(PaymentMethod),
    clientId: z.string(),
    observation: z.string().optional(),
  })
  const data = bodySchema.parse(request.body)
  const userId = request.user.sub
  const service = makeCreateSale()
  const { sale } = await service.execute({
    userId,
    method: data.method,
    clientId: data.clientId,
    observation: data.observation,
  })
  return reply.status(201).send(sale)
}
