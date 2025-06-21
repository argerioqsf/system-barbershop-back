import { makeUpdateRoleService } from '@/services/@factories/role/make-update-role'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { RoleName } from '@prisma/client'

export const UpdateRoleController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    name: z.nativeEnum(RoleName).optional(),
    permissionIds: z.array(z.string()).optional(),
  })
  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const service = makeUpdateRoleService()
  const { role } = await service.execute({ id, ...data })
  return reply.status(200).send(role)
}
