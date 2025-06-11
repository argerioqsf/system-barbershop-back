import { makeCreateUnitService } from '@/services/@factories/unit/make-create-unit'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function CreateUnitController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    name: z.string(),
    organizationId: z.string(),
  })
  const data = bodySchema.parse(request.body)
  const service = makeCreateUnitService()
  const { unit } = await service.execute(data)
  return reply.status(201).send(unit)
}
