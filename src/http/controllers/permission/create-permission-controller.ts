import { makeCreatePermissionService } from '@/services/@factories/permission/make-create-permission'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
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
  const service = makeCreatePermissionService()
  const { permission } = await service.execute({
    name,
    category,
  })
  return reply.status(201).send(permission)
}
