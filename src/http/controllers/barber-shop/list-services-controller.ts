import { makeListServices } from '@/services/@factories/barbershop/make-list-services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function ListServicesController(
  _: FastifyRequest,
  reply: FastifyReply,
) {
  const service = makeListServices()
  const { services } = await service.execute()
  return reply.status(200).send(services)
}
