import { withErrorHandling } from '@/utils/http-error-handler'
import { makeCreateOrganizationService } from '@/services/@factories/organization/make-create-organization'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const CreateOrganizationController = withErrorHandling(async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    name: z.string(),
    slug: z.string(),
  })
  const { name, slug } = bodySchema.parse(request.body)
  const service = makeCreateOrganizationService()
  const { organization } = await service.execute({ name, slug })
  return reply.status(201).send(organization)
})
