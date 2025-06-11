import { makeListOrganizationsService } from '@/services/@factories/organization/make-list-organizations'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function ListOrganizationsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const service = makeListOrganizationsService()
  const { organizations } = await service.execute()
  return reply.status(200).send(organizations)
}
