import { makeListSales } from '@/services/@factories/sale/make-list-sales'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function ListSalesController(request: FastifyRequest, reply: FastifyReply) {
  const service = makeListSales()
  const { sales } = await service.execute()
  return reply.status(200).send(sales)
}
