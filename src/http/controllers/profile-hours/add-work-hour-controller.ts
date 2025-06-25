import { makeAddProfileWorkHourService } from '@/services/@factories/profile/make-add-profile-work-hour-service'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const AddWorkHourController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ profileId: z.string() })
  const bodySchema = z.object({
    weekDay: z.number().min(0).max(6),
    startHour: z.string(),
    endHour: z.string(),
  })
  const { profileId } = paramsSchema.parse(request.params)
  const { weekDay, startHour, endHour } = bodySchema.parse(request.body)
  const service = makeAddProfileWorkHourService()
  const { workHour, workingHours } = await service.execute(request.user, {
    profileId,
    weekDay,
    startHour,
    endHour,
  })
  return reply.status(201).send({ workHour, workingHours })
}
