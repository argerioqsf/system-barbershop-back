import { makeListAppointmentBarbersService } from '@/services/@factories/barber-user/make-list-appointment-barbers'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'

export const ListAvailableBarbersController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListAppointmentBarbersService()
  const userToken = request.user as UserToken
  const { users } = await service.execute(userToken)
  return reply.status(200).send(users)
}
