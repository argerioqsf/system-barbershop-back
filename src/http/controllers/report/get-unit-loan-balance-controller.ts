import { makeUnitLoanBalance } from '@/services/@factories/report/make-unit-loan-balance'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const GetUnitLoanBalanceController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ unitId: z.string() })
  const { unitId } = paramsSchema.parse(request.params)
  const service = makeUnitLoanBalance()
  const { borrowed, paid } = await service.execute({ unitId })
  return reply.status(200).send({ borrowed, paid })
}
