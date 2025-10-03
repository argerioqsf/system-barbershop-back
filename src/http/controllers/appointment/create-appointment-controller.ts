import { makeCreateAppointment } from '@/modules/appointment/infra/factories/make-create-appointment'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const CreateAppointmentController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    clientId: z.string(),
    barberId: z.string(),
    serviceIds: z.array(z.string()).min(1, {
      message: 'É obrigatório informar ao menos um serviço.',
    }),
    date: z.coerce.date(),
    unitId: z.string().optional(),
  })

  const data = bodySchema.parse(request.body)

  const service = makeCreateAppointment()
  const unitId = data.unitId ?? request.user.unitId
  const { appointment } = await service.execute({
    clientId: data.clientId,
    barberId: data.barberId,
    serviceIds: data.serviceIds,
    date: data.date,
    unitId,
    userId: request.user.sub,
  })

  return reply.status(201).send(appointment)
}
