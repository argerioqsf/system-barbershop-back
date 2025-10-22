import { makePaySaleCoordinator } from '@/modules/finance/infra/factories/make-pay-sale-coordinator'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const PaySaleController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const userId = request.user.sub
  const coordinator = makePaySaleCoordinator()
  const { sale } = await coordinator.execute({
    saleId: id,
    userId,
  })

  return reply.status(200).send(sale)
}
