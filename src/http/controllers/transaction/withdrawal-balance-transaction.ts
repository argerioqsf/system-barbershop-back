import { withErrorHandling } from '@/utils/http-error-handler'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'
import { makeWithdrawalBalanceTransaction } from '@/services/@factories/transaction/make-withdrawal-balance-transaction'
import { assertPermission } from '@/utils/permissions'

export const WithdrawalBalanceTransactionController = withErrorHandling(
  async (request: FastifyRequest, reply: FastifyReply) => {
    const bodySchema = z.object({
      description: z.string(),
      amount: z.coerce.number(),
      affectedUserId: z.string().optional(),
    })
    const user = request.user as UserToken
    const data = bodySchema.parse(request.body)

    if (data.affectedUserId) {
      assertPermission(user.role, 'MANAGE_OTHER_USER_TRANSACTION')
    }

    const receiptUrl = request.file
      ? `/uploads/${request.file.filename}`
      : undefined
    const userId = user.sub
    const service = makeWithdrawalBalanceTransaction()
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
