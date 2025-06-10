import { makeCreateTransaction } from '@/services/@factories/transaction/make-create-transaction'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function CreateTransactionController(request: FastifyRequest, reply: FastifyReply) {
  const bodySchema = z.object({
    userId: z.string(),
    type: z.enum(['ADDITION', 'WITHDRAWAL']),
    description: z.string(),
    amount: z.number(),
  })
  const data = bodySchema.parse(request.body)
  const service = makeCreateTransaction()
  const { transaction } = await service.execute(data)
  return reply.status(201).send(transaction)
}
