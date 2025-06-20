import { makeCreateRoleService } from '@/services/@factories/role/make-create-role'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'

export const CreateRoleController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({
    name: z.string(),
    permissionIds: z.array(z.string()).optional(),
  })
  const { name, permissionIds } = bodySchema.parse(request.body)
  const unitId = (request.user as UserToken).unitId
  const service = makeCreateRoleService()
  const { role } = await service.execute({ name, unitId, permissionIds })
  return reply.status(201).send(role)
}
