import { makeCreateLoan } from '@/services/@factories/loan/make-create-loan'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const CreateLoanController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({ amount: z.number() })
  const { amount } = bodySchema.parse(request.body)
  const userId = request.user.sub
  const service = makeCreateLoan()
  const { loan } = await service.execute({ userId, amount })
  return reply.status(201).send({ loan })
}
