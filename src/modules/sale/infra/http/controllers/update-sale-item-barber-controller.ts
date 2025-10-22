import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { makeSaleItemCoordinator } from '@/modules/sale/infra/factories/make-sale-item-coordinator'

export const UpdateSaleItemBarberController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    barberId: z.string().nullable().optional(),
  })

  const { id } = paramsSchema.parse(request.params)
  const { barberId } = bodySchema.parse(request.body)

  const coordinator = makeSaleItemCoordinator()
  const performedBy = request.user.sub
  const { sale, saleItems } = await coordinator.updateBarber({
    saleItemId: id,
    barberId,
    performedBy,
  })

  return reply.status(200).send({ sale, saleItems })
}
