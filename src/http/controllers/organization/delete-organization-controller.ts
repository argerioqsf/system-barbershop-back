import { makeDeleteOrganizationService } from '@/services/@factories/organization/make-delete-organization'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function DeleteOrganizationController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const paramsSchema = z.object({
    id: z.string(),
  })
  const { id } = paramsSchema.parse(request.params)
  const service = makeDeleteOrganizationService()
  await service.execute(id)
  return reply.status(204).send()
}
