import { makePaySale } from '@/services/@factories/sale/make-set-sale-status'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const PaySaleController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const userId = request.user.sub
  const service = makePaySale()
  const { sale } = await service.execute({
    saleId: id,
    userId,
  })
  return reply.status(200).send(sale)
}
