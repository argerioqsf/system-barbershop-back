import { makeListUserPendingCommissions } from '@/modules/finance/infra/factories/make-list-user-pending-commissions'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const ListPendingCommissionsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ userId: z.string() })
  const { userId } = paramsSchema.parse(request.params)
  const service = makeListUserPendingCommissions()
  const { saleItemsRecords, totalCommission, outstanding, loans } =
    await service.execute({
      userId,
    })
  return reply
    .status(200)
    .send({ saleItemsRecords, totalCommission, loans, outstanding })
}
