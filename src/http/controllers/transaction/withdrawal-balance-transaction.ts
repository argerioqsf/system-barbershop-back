import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'
import { makeWithdrawalBalanceTransaction } from '@/services/@factories/transaction/make-withdrawal-balance-transaction'
import { assertPermission } from '@/utils/permissions'

export const WithdrawalBalanceTransactionController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    description: z.string(),
    amount: z.coerce.number(),
    affectedUserId: z.string().optional(),
    discountLoans: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === 'boolean') return val
        return val === 'true'
      })
      .optional(),
  })
  const user = request.user as UserToken
  const data = bodySchema.parse(request.body)

  if (data.affectedUserId) {
    await assertPermission(['MANAGE_OTHER_USER_TRANSACTION'], user.permissions)
  }
  const receiptUrl = request.file
    ? `/uploads/${request.file.filename}`
    : undefined
  const userId = user.sub
  const service = makeWithdrawalBalanceTransaction()
  const { transactions } = await service.execute(
    {
      userId,
      affectedUserId: data.affectedUserId,
      description: data.description,
      amount: data.amount,
      receiptUrl,
      discountLoans: data.discountLoans,
    },
    user,
  )
  return reply.status(201).send({ transactions })
}
