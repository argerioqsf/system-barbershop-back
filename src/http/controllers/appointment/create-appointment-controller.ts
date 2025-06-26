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
    serviceIds: z.array(z.string()),
    date: z.coerce.date(),
    unitId: z.string().optional(),
    value: z.number().optional(),
  })

  const data = bodySchema.parse(request.body)

  const service = makeCreateAppointment()
  const unitId = data.unitId ?? (request.user as UserToken).unitId
  const { appointment } = await service.execute({
    clientId: data.clientId,
    barberId: data.barberId,
    serviceIds: data.serviceIds,
    date: data.date,
    value: data.value,
    unitId,
    userId: (request.user as UserToken).sub,
  })

  return reply.status(201).send(appointment)
}
