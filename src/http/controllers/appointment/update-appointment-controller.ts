import { makeUpdateAppointment } from '@/modules/appointment/infra/factories/make-update-appointment'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { AppointmentStatus } from '@prisma/client'
import { UserToken } from '../authenticate-controller'

export const UpdateAppointmentController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    status: z.nativeEnum(AppointmentStatus).optional(),
    observation: z.string().optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const useCase = makeUpdateAppointment()
  const { appointment } = await useCase.execute({
    id,
    data,
    actorId: (request.user as UserToken).sub,
  })
  return reply.status(200).send(appointment)
}
