import { makeListTransactions } from '@/services/@factories/transaction/make-list-transactions'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'

export const ListTransactionsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListTransactions()
  const user = request.user as UserToken
  const { transactions } = await service.execute(user)
  return reply.status(200).send(transactions)
}
