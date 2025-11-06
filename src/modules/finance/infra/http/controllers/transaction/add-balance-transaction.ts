import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '@/http/controllers/authenticate-controller'
import { assertPermission } from '@/utils/permissions'
import { makeAddBalanceUseCase } from '@/modules/finance/infra/factories/make-add-balance'
import { Money } from '@/core/domain/value-objects/money'
import { TransactionReason } from '@/modules/finance/domain/entities/transaction'

export const AddBalanceTransactionController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    description: z.string(),
    amount: z.coerce.number(),
    affectedUserId: z.string().optional(),
    reason: z.nativeEnum(TransactionReason),
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
  const useCase = makeAddBalanceUseCase()
  const { transactions } = await useCase.execute({
    actorId: userId,
    unitId: user.unitId,
    description: data.description,
    amount: Money.from(data.amount),
    affectedUserId: data.affectedUserId,
    receiptUrl,
    reason: data.reason,
  })
  return reply.status(201).send({ transactions })
}
