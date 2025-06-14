import { makeCreateTransaction } from '@/services/@factories/transaction/make-create-transaction'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function CreateTransactionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    type: z.enum(['ADDITION', 'WITHDRAWAL']),
    description: z.string(),
    amount: z.number(),
  })
  const data = bodySchema.parse(request.body)
  const userId = request.user.sub
  const service = makeCreateTransaction()
  const { transaction, surplusValue } = await service.execute({
    ...data,
    userId,
  })
  return reply.status(201).send({ transaction, surplusValue })
}
