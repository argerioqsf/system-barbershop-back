import { makeListProductSellersService } from '@/services/@factories/barber-user/make-list-product-sellers'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'

export const ListProductSellersController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListProductSellersService()
  const userToken = request.user as UserToken
  const { users } = await service.execute(userToken)
  return reply.status(200).send(users)
}
