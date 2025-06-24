import { makeAddProfileBlockedHourService } from '@/services/@factories/profile/make-add-profile-blocked-hour-service'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const AddBlockedHourController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ profileId: z.string() })
  const bodySchema = z.object({
    startHour: z.coerce.date(),
    endHour: z.coerce.date(),
  })
  const { profileId } = paramsSchema.parse(request.params)
  const { startHour, endHour } = bodySchema.parse(request.body)
  const service = makeAddProfileBlockedHourService()
  const { blocked } = await service.execute(request.user, {
    profileId,
    startHour,
    endHour,
  })
  return reply.status(201).send(blocked)
}
