import { makeListAppointments } from '@/services/@factories/appointment/make-list-appointments'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function ListAppointmentsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const service = makeListAppointments()
  const { appointments } = await service.execute()
  return reply.status(200).send(appointments)
}
