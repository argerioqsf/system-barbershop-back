import { makeCreateTransaction } from '@/services/@factories/transaction/make-create-transaction'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export async function CreateTransactionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    type: z.enum(['ADDITION', 'WITHDRAWAL']),
    description: z.string(),
    amount: z.number(),
    affectedUserId: z.string().optional(),
  })
  const data = bodySchema.parse(request.body)
  const receiptUrl = request.file
    ? `/uploads/${request.file.filename}`
    : undefined
  const user = request.user as UserToken
  if (
    data.affectedUserId &&
    user.role !== 'ADMIN' &&
    user.role !== 'OWNER' &&
    user.role !== 'MANAGER'
  ) {
    return reply.status(403).send({ message: 'Unauthorized' })
  }
  const userId = user.sub
  const service = makeCreateTransaction()
  const { transaction, surplusValue } = await service.execute({
    type: data.type,
    description: data.description,
    amount: data.amount,
    userId,
    affectedUserId: data.affectedUserId,
    receiptUrl,
  })
  return reply.status(201).send({ transaction, surplusValue })
}
