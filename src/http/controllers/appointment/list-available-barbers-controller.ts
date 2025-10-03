import { makeListAvailableBarbers } from '@/modules/appointment/infra/factories/make-list-available-barbers'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'

export const ListAvailableBarbersController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const useCase = makeListAvailableBarbers()
  const userToken = request.user as UserToken
  const { users } = await useCase.execute(userToken)
  return reply.status(200).send(users)
}
