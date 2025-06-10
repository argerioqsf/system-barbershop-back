import { makeCreateSale } from '@/services/@factories/sale/make-create-sale'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function CreateSaleController(request: FastifyRequest, reply: FastifyReply) {
  const bodySchema = z.object({
    userId: z.string(),
    unitId: z.string(),
    method: z.enum(['CASH', 'PIX', 'CREDIT_CARD', 'DEBIT_CARD']),
    items: z.array(z.object({ serviceId: z.string(), quantity: z.number().min(1) })),
    couponCode: z.string().optional(),
    total: z.number().optional(),
  })
  const data = bodySchema.parse(request.body)
  const service = makeCreateSale()
  const { sale } = await service.execute(data)
  return reply.status(201).send(sale)
}
