import { makeGetSale } from '@/modules/sale/infra/factories/make-get-sale'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const GetSaleController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeGetSale()
  const { sale } = await service.execute({ id })
  if (!sale) return reply.status(404).send({ message: 'Sale not found' })
  return reply.status(200).send(sale)
}
