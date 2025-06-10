import { makeListServices } from '@/services/@factories/barbershop/make-list-services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function ListServicesController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const service = makeListServices()
  const unitId = (request.user as any).unitId as string
  const { services } = await service.execute(unitId)
  return reply.status(200).send(services)
}
