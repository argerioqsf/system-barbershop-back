import { makeListAppointments } from '@/services/@factories/appointment/make-list-appointments'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'
import { z } from 'zod'

export const ListAppointmentsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListAppointments()
  const user = request.user as UserToken
  const { appointments } = await service.execute(user)
  const querySchema = z.object({
    withCount: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    perPage: z.coerce.number().int().min(1).max(100).optional(),
  })
  const { withCount, page, perPage } = querySchema.parse(request.query)
  const count = appointments.length
  const items =
    page && perPage
      ? appointments.slice((page - 1) * perPage, (page - 1) * perPage + perPage)
      : appointments
  if (withCount) {
    return reply
      .status(200)
      .send({ items, count, page: page ?? 1, perPage: perPage ?? items.length })
  }
  return reply.status(200).send(items)
}
