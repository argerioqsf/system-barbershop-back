import { makeUpdateUnitService } from '@/services/@factories/unit/make-update-unit'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function UpdateUnitController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    name: z.string(),
    slug: z.string().optional(),
  })
  const paramsSchema = z.object({
    id: z.string(),
  })
  const { name, slug } = bodySchema.parse(request.body)
  const { id } = paramsSchema.parse(request.params)
  const service = makeUpdateUnitService()
  const { unit } = await service.execute({ id, name, slug })
  return reply.status(200).send(unit)
}
