import { makeCreateOrganizationService } from '@/services/@factories/organization/make-create-organization'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function CreateOrganizationController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    name: z.string(),
  })
  const { name } = bodySchema.parse(request.body)
  const service = makeCreateOrganizationService()
  const { organization } = await service.execute({ name })
  return reply.status(201).send(organization)
}
