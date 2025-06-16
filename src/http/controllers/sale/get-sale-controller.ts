import { makeGetSale } from '@/services/@factories/sale/make-get-sale'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function GetSaleController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const service = makeGetSale()
  const { sale } = await service.execute({ id })
  if (!sale) return reply.status(404).send({ message: 'Sale not found' })
  return reply.status(200).send(sale)
}
