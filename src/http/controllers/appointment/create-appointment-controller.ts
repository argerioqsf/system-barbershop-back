import { makeCreateAppointment } from '@/services/@factories/appointment/make-create-appointment'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function CreateAppointmentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    clientId: z.string(),
    barberId: z.string(),
    serviceId: z.string(),
    unitId: z.string(),
    date: z.coerce.date(),
    hour: z.string(),
  })

  const data = bodySchema.parse(request.body)

  const service = makeCreateAppointment()
  const { appointment } = await service.execute(data)

  return reply.status(201).send(appointment)
}
