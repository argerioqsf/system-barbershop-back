import { makeListSales } from '@/services/@factories/sale/make-list-sales'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function ListSalesController(request: FastifyRequest, reply: FastifyReply) {
  const service = makeListSales()
  const unitId = (request.user as any).unitId as string
  const { sales } = await service.execute(unitId)
  return reply.status(200).send(sales)
}
