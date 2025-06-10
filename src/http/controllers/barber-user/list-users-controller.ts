import { makeListUsersService } from '@/services/@factories/barber-user/make-list-users'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function ListBarberUsersController(_: FastifyRequest, reply: FastifyReply) {
  const service = makeListUsersService()
  const { users } = await service.execute()
  return reply.status(200).send(users)
}
