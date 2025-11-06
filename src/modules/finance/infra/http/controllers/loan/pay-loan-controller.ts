import { makePayLoanUseCase } from '@/modules/finance/infra/factories/make-pay-loan'
import { Money } from '@/core/domain/value-objects/money'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const PayLoanController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({ amount: z.number() })
  const { id } = paramsSchema.parse(request.params)
  const { amount } = bodySchema.parse(request.body)

  const user = request.user
  const useCase = makePayLoanUseCase()
  const { transactions, remaining } = await useCase.execute({
    loanId: id,
    amount: Money.from(amount),
    actorId: user.sub,
  })
  return reply
    .status(200)
    .send({ transactions, remaining: remaining.toNumber() })
}
