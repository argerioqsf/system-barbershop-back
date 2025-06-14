import { makeCreateUnitService } from '@/services/@factories/unit/make-create-unit'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export async function CreateUnitController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    name: z.string(),
    slug: z.string(),
    organizationId: z.string().optional(),
  })
  const data = bodySchema.parse(request.body)
  const service = makeCreateUnitService()
  const userToken = request.user as UserToken
  const { unit } = await service.execute({ ...data, userToken })
  return reply.status(201).send(unit)
}
