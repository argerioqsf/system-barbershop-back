import { makeListOrganizationsService } from '@/services/@factories/organization/make-list-organizations'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'

export const ListOrganizationsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListOrganizationsService()
  const user = request.user as UserToken
  const { organizations } = await service.execute(user)
  return reply.status(200).send(organizations)
}
