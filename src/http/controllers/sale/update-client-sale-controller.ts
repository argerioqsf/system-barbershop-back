import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeUpdateClientSale } from '@/modules/sale/infra/factories/make-update-client-sale'

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
  const performedBy = request.user.sub
  const service = makeUpdateClientSale()
  const { sale } = await service.execute({
    id,
    clientId,
    performedBy,
  })
  return reply.status(200).send(sale)
}
