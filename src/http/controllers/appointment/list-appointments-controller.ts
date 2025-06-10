import { makeListAppointments } from '@/services/@factories/appointment/make-list-appointments'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function ListAppointmentsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const service = makeListAppointments()
  const unitId = (request.user as any).unitId as string
  const { appointments } = await service.execute(unitId)
  return reply.status(200).send(appointments)
}
