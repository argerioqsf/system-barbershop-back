import { makeListUsersService } from '@/services/@factories/barber-user/make-list-users'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const ListBarberUsersController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const querySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    perPage: z.coerce.number().int().min(1).max(100).optional(),
    name: z.string().optional(),
    withCount: z.coerce.boolean().optional(),
  })
  const { page, perPage, name, withCount } = querySchema.parse(request.query)

  const service = makeListUsersService()
  const userToken = request.user as UserToken

  const result = await service.execute(userToken, { page, perPage, name })

  if (withCount) {
    return reply.status(200).send({
      items: result.users,
      count: result.count,
      page: page ?? 1,
      perPage: perPage ?? 10,
    })
  }

  return reply.status(200).send(result.users)
}
