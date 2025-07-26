import { makeListDebtsService } from '@/services/@factories/debt/make-list-debts'
import { FastifyRequest, FastifyReply } from 'fastify'

export const ListDebtsController = async (
  _: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListDebtsService()
  const { debts } = await service.execute()
  return reply.status(200).send(debts)
}
