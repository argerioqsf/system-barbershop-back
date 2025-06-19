import { withErrorHandling } from '@/utils/http-error-handler'
import { makeCreateUnitService } from '@/services/@factories/unit/make-create-unit'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const CreateUnitController = withErrorHandling(async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    name: z.string(),
    slug: z.string(),
    organizationId: z.string().optional(),
    allowsLoan: z.boolean().optional(),
  })
  const data = bodySchema.parse(request.body)
  const service = makeCreateUnitService()
  const userToken = request.user as UserToken
  const { unit } = await service.execute({
    name: data.name,
    slug: data.slug,
    organizationId: data.organizationId,
    allowsLoan: data.allowsLoan,
    userToken,
  })
  return reply.status(201).send(unit)
})
