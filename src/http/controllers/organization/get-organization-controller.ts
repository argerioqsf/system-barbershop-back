import { withErrorHandling } from '@/utils/http-error-handler'
import { makeGetOrganizationService } from '@/services/@factories/organization/make-get-organization'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const GetOrganizationController = withErrorHandling(
  async (request: FastifyRequest, reply: FastifyReply) => {
    const paramsSchema = z.object({
      id: z.string(),
    })
    const { id } = paramsSchema.parse(request.params)
    const service = makeGetOrganizationService()
    const { organization } = await service.execute(id)
    return reply.status(200).send(organization)
  },
)
