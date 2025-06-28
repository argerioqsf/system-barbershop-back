import { makeListUserPendingCommissions } from '@/services/@factories/sale/make-list-user-pending-commissions'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const ListPendingCommissionsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ userId: z.string() })
  const { userId } = paramsSchema.parse(request.params)
  const service = makeListUserPendingCommissions()
  const { saleItems, appointmentServices } = await service.execute({ userId })
  return reply.status(200).send({ saleItems, appointmentServices })
}
