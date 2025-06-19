import { withErrorHandling } from '@/utils/http-error-handler'
import { makeOwnerBalance } from '@/services/@factories/report/make-owner-balance'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const GetOwnerBalanceController = withErrorHandling(
  async (request: FastifyRequest, reply: FastifyReply) => {
    const paramsSchema = z.object({ ownerId: z.string() })
    const { ownerId } = paramsSchema.parse(request.params)
    const service = makeOwnerBalance()
    const { balance, historySales } = await service.execute({ ownerId })
    return reply.status(200).send({ balance, historySales })
  },
)
