import { makeUpdateAppointment } from '@/services/@factories/appointment/make-update-appointment'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { AppointmentStatus } from '@prisma/client'

export const UpdateAppointmentController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    status: z.nativeEnum(AppointmentStatus).optional(),
    observation: z.string().optional(),
    value: z.coerce.number().optional(),
    discount: z.coerce.number().optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const service = makeUpdateAppointment()
  const { appointment } = await service.execute({ id, data })
  return reply.status(200).send(appointment)
}
