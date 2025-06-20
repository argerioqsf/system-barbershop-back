import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'
import { makeAddBalanceTransaction } from '@/services/@factories/transaction/make-add-balance-transaction'
import { assertPermission } from '@/utils/permissions'
import { getProfileFromUserIdService } from '@/services/@factories/profile/get-profile-from-userId-service'

export const AddBalanceTransactionController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    description: z.string(),
    amount: z.coerce.number(),
    affectedUserId: z.string().optional(),
  })
  const user = request.user as UserToken
  const data = bodySchema.parse(request.body)

  if (data.affectedUserId) {
    const getProfileFromUserId = getProfileFromUserIdService()
    const { profile } = await getProfileFromUserId.execute({ id: user.sub })
    const permissions = profile.permissions.map((p) => p.name)
    assertPermission(permissions, 'MANAGE_OTHER_USER_TRANSACTION')
  }

  const receiptUrl = request.file
    ? `/uploads/${request.file.filename}`
    : undefined

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
}
