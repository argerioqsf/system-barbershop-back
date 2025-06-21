import { makeUpdatePermissionService } from '@/services/@factories/permission/make-update-permission'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { PermissionCategory, PermissionName } from '@prisma/client'

export const UpdatePermissionController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    name: z.nativeEnum(PermissionName).optional(),
    category: z.nativeEnum(PermissionCategory).optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const service = makeUpdatePermissionService()
  const { permission } = await service.execute({ id, ...data })
  return reply.status(200).send(permission)
}
