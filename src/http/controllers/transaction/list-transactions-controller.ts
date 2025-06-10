import { makeListTransactions } from '@/services/@factories/transaction/make-list-transactions'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function ListTransactionsController(request: FastifyRequest, reply: FastifyReply) {
  const service = makeListTransactions()
  const unitId = (request.user as any).unitId as string
  const { transactions } = await service.execute(unitId)
  return reply.status(200).send(transactions)
}
