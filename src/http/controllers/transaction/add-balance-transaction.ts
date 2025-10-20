import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'
import { makeAddBalanceTransaction } from '@/services/@factories/transaction/make-add-balance-transaction'
import { assertPermission } from '@/utils/permissions'
import { ReasonTransaction } from '@prisma/client'

export const AddBalanceTransactionController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    description: z.string(),
    amount: z.coerce.number(),
    affectedUserId: z.string().optional(),
    reason: z.nativeEnum(ReasonTransaction).optional(),
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
  const service = makeAddBalanceTransaction()
  const { transactions } = await service.execute({
    description: data.description,
    amount: data.amount,
    userId,
    affectedUserId: data.affectedUserId,
    receiptUrl,
    reason: data.reason ?? ReasonTransaction.OTHER,
  })
  return reply.status(201).send({ transactions })
}
