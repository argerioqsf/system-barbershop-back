import { makeCreateAppointment } from '@/services/@factories/appointment/make-create-appointment'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export async function CreateAppointmentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    clientId: z.string(),
    barberId: z.string(),
    serviceId: z.string(),
    date: z.coerce.date(),
    unitId: z.string().optional(),
    hour: z.string(),
  })

  const data = bodySchema.parse(request.body)

  const service = makeCreateAppointment()
  const unitId = data.unitId ?? (request.user as UserToken).unitId
  const { appointment } = await service.execute({ ...data, unitId })

  return reply.status(201).send(appointment)
}
