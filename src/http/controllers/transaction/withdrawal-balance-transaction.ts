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
  })
  const user = request.user as UserToken
  const data = bodySchema.parse(request.body)

  if (data.affectedUserId) {
    await assertPermission(['MANAGE_OTHER_USER_TRANSACTION'], user.permissions)
  }
  // TODO: corrigir logica de retirada, ela vai ser a mesma coisa que pagamento de comissao,
  // porem com um tipo de transacao diferente o pagamento de balanco tera o tpo de pagamento de comissao
  // e a retirada sera do tipo retirada avulsa paenas para historico e acompanahmento
  // possibilitar fazer retiradas da unidade tbm
  const receiptUrl = request.file
    ? `/uploads/${request.file.filename}`
    : undefined
  const userId = user.sub
  const service = makeWithdrawalBalanceTransaction()
  const { transactions } = await service.execute({
    description: data.description,
    amount: data.amount,
    userId,
    affectedUserId: data.affectedUserId,
    receiptUrl,
  })
  return reply.status(201).send({ transactions })
}
