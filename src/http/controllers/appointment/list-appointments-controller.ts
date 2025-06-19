import { withErrorHandling } from '@/utils/http-error-handler'
import { makeListAppointments } from '@/services/@factories/appointment/make-list-appointments'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'

export const ListAppointmentsController = withErrorHandling(async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListAppointments()
  const user = request.user as UserToken
  const { appointments } = await service.execute(user)
  return reply.status(200).send(appointments)
})
