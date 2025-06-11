import { makeGetUnitService } from '@/services/@factories/unit/make-get-unit'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function GetUnitController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const paramsSchema = z.object({
    id: z.string(),
  })
  const { id } = paramsSchema.parse(request.params)
  const service = makeGetUnitService()
  const { unit } = await service.execute(id)
  return reply.status(200).send(unit)
}
