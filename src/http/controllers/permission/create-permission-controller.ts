import { makeCreatePermissionService } from '@/services/@factories/permission/make-create-permission'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const CreatePermissionController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    name: z.string(),
    featureIds: z.array(z.string()),
    roleIds: z.array(z.string()).optional(),
  })
  const { name, featureIds, roleIds } = bodySchema.parse(request.body)
  const unitId = (request.user as UserToken).unitId
  const service = makeCreatePermissionService()
  const { permission } = await service.execute({
    name,
    featureIds,
    unitId,
    roleIds,
  })
  return reply.status(201).send(permission)
}
