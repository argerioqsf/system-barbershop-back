import { makeListSales } from '@/services/@factories/sale/make-list-sales'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'

export async function ListSalesController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const service = makeListSales()
  const user = request.user as UserToken
  const { sales } = await service.execute(user)
  return reply.status(200).send(sales)
}
