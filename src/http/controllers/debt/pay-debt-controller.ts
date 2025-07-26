import { makePayDebtService } from '@/services/@factories/plan/make-pay-debt'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const PayDebtController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const user = request.user as UserToken
  const service = makePayDebtService()
  const { transaction } = await service.execute({
    debtId: id,
    userId: user.sub,
  })
  return reply.status(200).send({ transaction })
}
