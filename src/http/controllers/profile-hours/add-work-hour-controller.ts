import { makeAddProfileWorkHourService } from '@/services/@factories/profile/make-add-profile-work-hour-service'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const AddWorkHourController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ profileId: z.string() })
  const bodySchema = z.object({ dayHourId: z.string() })
  const { profileId } = paramsSchema.parse(request.params)
  const { dayHourId } = bodySchema.parse(request.body)
  const service = makeAddProfileWorkHourService()
  const { workHour } = await service.execute(request.user, {
    profileId,
    dayHourId,
  })
  return reply.status(201).send(workHour)
}
