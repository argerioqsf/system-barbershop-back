import { makeListClientsService } from '@/services/@factories/barber-user/make-list-clients'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'
import { z } from 'zod'

export const ListClientsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListClientsService()
  const userToken = request.user as UserToken

  const querySchema = z.object({
    name: z.string().optional(),
  })
  const params = querySchema.parse(request.query)

  const { users } = await service.execute(userToken, params)

  return reply.status(200).send(users)
}
