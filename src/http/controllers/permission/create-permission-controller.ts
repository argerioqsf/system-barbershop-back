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
  })
  const { name, featureIds } = bodySchema.parse(request.body)
  const unitId = (request.user as UserToken).unitId
  const service = makeCreatePermissionService()
  const { permission } = await service.execute({
    name,
    featureIds,
    unitId,
  })
  return reply.status(201).send(permission)
}
