import { makeAddUnitOpeningHourService } from '@/services/@factories/unit/make-add-unit-opening-hour-service'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

export const AddUnitOpeningHourController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ unitId: z.string() })
  const bodySchema = z.object({
    weekDay: z.number().min(0).max(6),
    startHour: z.string(),
    endHour: z.string(),
  })
  const { unitId } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const service = makeAddUnitOpeningHourService()
  const { openingHour } = await service.execute({ unitId, ...data })
  return reply.status(201).send(openingHour)
}
