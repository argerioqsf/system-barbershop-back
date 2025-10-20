import { makeCreateTransaction } from '@/services/@factories/transaction/make-create-transaction'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'
import { ReasonTransaction } from '@prisma/client'

export const CreateTransactionController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    type: z.enum(['ADDITION', 'WITHDRAWAL']),
    description: z.string(),
    amount: z.coerce.number(),
    affectedUserId: z.string().optional(),
    reason: z.nativeEnum(ReasonTransaction).optional(),
  })
  const data = bodySchema.parse(request.body)
  const receiptUrl = request.file
    ? `/uploads/${request.file.filename}`
    : undefined
  const user = request.user as UserToken
  const userId = user.sub
  const service = makeCreateTransaction()
  const { transaction } = await service.execute({
    type: data.type,
    description: data.description,
    amount: data.amount,
    userId,
    affectedUserId: data.affectedUserId,
    receiptUrl,
    reason: data.reason ?? ReasonTransaction.OTHER,
  })
  return reply.status(201).send({ transaction })
}
