import { makeCreateAppointment } from '@/services/@factories/appointment/make-create-appointment'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const CreateAppointmentController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    clientId: z.string(),
    barberId: z.string(),
    serviceId: z.string(),
    date: z.coerce.date(),
    unitId: z.string().optional(),
    hour: z.string(),
    value: z.number(),
  })

  const data = bodySchema.parse(request.body)

  const service = makeCreateAppointment()
  const unitId = data.unitId ?? (request.user as UserToken).unitId
  const { appointment } = await service.execute({
    clientId: data.clientId,
    barberId: data.barberId,
    serviceId: data.serviceId,
    date: data.date,
    hour: data.hour,
    value: data.value,
    unitId,
  })

  return reply.status(201).send(appointment)
}
