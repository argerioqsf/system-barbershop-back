import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeUpdateClientSale } from '@/services/@factories/sale/make-update-client-sale'

export const UpdateClientSaleController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    clientId: z.string().optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const { clientId } = bodySchema.parse(request.body)
  const service = makeUpdateClientSale()
  const { sale } = await service.execute({
    id,
    clientId,
  })
  return reply.status(200).send(sale)
}
