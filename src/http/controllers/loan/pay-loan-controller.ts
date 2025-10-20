import { makePayLoan } from '@/services/@factories/loan/make-pay-loan'
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
  const service = makePayLoan()
  const { transactions, remaining } = await service.execute({
    loanId: id,
    amount,
    user,
  })
  return reply.status(200).send({ transactions, remaining })
}
