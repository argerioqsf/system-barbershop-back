import { makeCreatePermissionService } from '@/services/@factories/permission/make-create-permission'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'
import { PermissionCategory, PermissionName } from '@prisma/client'

export const CreatePermissionController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    name: z.nativeEnum(PermissionName),
    category: z.nativeEnum(PermissionCategory),
  })
  const { name, category } = bodySchema.parse(request.body)
  const unitId = (request.user as UserToken).unitId
  const service = makeCreatePermissionService()
  const { permission } = await service.execute({
    name,
    category,
    unitId,
  })
  return reply.status(201).send(permission)
}
