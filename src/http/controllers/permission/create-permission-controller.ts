import { makeCreatePermissionService } from '@/services/@factories/permission/make-create-permission'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const CreatePermissionController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    action: z.string(),
    category: z.string(),
  })
  const { action, category } = bodySchema.parse(request.body)
  const unitId = (request.user as UserToken).unitId
  const service = makeCreatePermissionService()
  const { permission } = await service.execute({
    action,
    category,
    unitId,
  })
  return reply.status(201).send(permission)
}
