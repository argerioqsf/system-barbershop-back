import { makeListUnitsService } from '@/services/@factories/unit/make-list-units'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function ListUnitsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const querySchema = z.object({
    organizationId: z.string(),
  })
  const { organizationId } = querySchema.parse(request.query)
  const service = makeListUnitsService()
  const { units } = await service.execute(organizationId)
  return reply.status(200).send(units)
}
