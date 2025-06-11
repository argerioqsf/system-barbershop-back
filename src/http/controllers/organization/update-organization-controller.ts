import { makeUpdateOrganizationService } from '@/services/@factories/organization/make-update-organization'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function UpdateOrganizationController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    name: z.string(),
  })
  const paramsSchema = z.object({
    id: z.string(),
  })
  const { name } = bodySchema.parse(request.body)
  const { id } = paramsSchema.parse(request.params)
  const service = makeUpdateOrganizationService()
  const { organization } = await service.execute({ id, name })
  return reply.status(200).send(organization)
}
