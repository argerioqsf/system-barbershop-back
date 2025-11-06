import { makePayDebtUseCase } from '@/modules/finance/infra/factories/make-pay-debt'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '@/http/controllers/authenticate-controller'

export const PayDebtController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const { id } = paramsSchema.parse(request.params)
  const user = request.user as UserToken
  const useCase = makePayDebtUseCase()
  const { transaction } = await useCase.execute({
    debtId: id,
    userId: user.sub,
  })
  return reply.status(200).send({ transaction })
}
