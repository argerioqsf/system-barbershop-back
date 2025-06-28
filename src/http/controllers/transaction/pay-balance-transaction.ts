import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'
import { makePayBalanceTransaction } from '@/services/@factories/transaction/make-pay-balance-transaction'
import { assertPermission } from '@/utils/permissions'

export const PayBalanceTransactionController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    description: z.string().optional(),
    amount: z.coerce.number(),
    affectedUserId: z.string(),
  })

  const user = request.user as UserToken
  const data = bodySchema.parse(request.body)

  await assertPermission(['MANAGE_OTHER_USER_TRANSACTION'], user.permissions)

  const receiptUrl = request.file
    ? `/uploads/${request.file.filename}`
    : undefined
  const service = makePayBalanceTransaction()
  const { transactions } = await service.execute({
    userId: user.sub,
    affectedUserId: data.affectedUserId,
    description: data.description,
    amount: data.amount,
    receiptUrl,
  })
  return reply.status(201).send({ transactions })
}
