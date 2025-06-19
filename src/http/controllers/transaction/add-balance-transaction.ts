import { withErrorHandling } from '@/utils/http-error-handler'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'
import { makeAddBalanceTransaction } from '@/services/@factories/transaction/make-add-balance-transaction'

export const AddBalanceTransactionController = withErrorHandling(
  async (request: FastifyRequest, reply: FastifyReply) => {
    const bodySchema = z.object({
      description: z.string(),
      amount: z.coerce.number(),
      affectedUserId: z.string().optional(),
    })
    const data = bodySchema.parse(request.body)
    const receiptUrl = request.file
      ? `/uploads/${request.file.filename}`
      : undefined
    const user = request.user as UserToken

    const userId = user.sub
    const service = makeAddBalanceTransaction()
    const { transactions, surplusValue } = await service.execute({
      description: data.description,
      amount: data.amount,
      userId,
      affectedUserId: data.affectedUserId,
      receiptUrl,
    })
    return reply.status(201).send({ transactions, surplusValue })
  },
)
