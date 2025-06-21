import { makeUpdateUserService } from '@/services/@factories/barber-user/make-update-user'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from '../authenticate-controller'
import { UpdateUserResponse } from '@/services/barber-user/update-user'

function handleChangeCredentials(
  result: UpdateUserResponse,
  data: { roleId?: string; unitId?: string; permissions?: string[] },
): boolean {
  const oldPermissions =
    result.oldUser?.profile?.permissions.map((permission) => permission.id) ??
    []
  const changedRole = data.roleId
    ? data?.roleId !== result.oldUser?.profile?.roleId
    : false
  const changedUnit = data?.unitId
    ? data?.unitId !== result.oldUser?.unitId
    : false
  const changedPermission = !data.permissions?.every((permission) =>
    oldPermissions.includes(permission),
  )

  return changedRole || changedUnit || !!changedPermission
}

export const UpdateBarberUserController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
        versionToken: result.user.versionToken,
  const paramsSchema = z.object({ id: z.string() })
  const bodySchema = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    cpf: z.string().optional(),
    genre: z.string().optional(),
    birthday: z.string().optional(),
    pix: z.string().optional(),
    unitId: z.string().optional(),
    roleId: z.string().optional(),
    permissions: z.array(z.string()).optional(),
    commissionPercentage: z.number().optional(),
    active: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === 'boolean') return val
        return val === 'true'
      })
      .optional(),
  })

  const { id } = paramsSchema.parse(request.params)
  const data = bodySchema.parse(request.body)
  const service = makeUpdateUserService()
  const userToken = request.user as UserToken

  const result = await service.execute({ id, ...data })

  const changeCredentials = handleChangeCredentials(result, data)

  if (id === userToken.sub && changeCredentials) {
    const permissions = result.profile?.permissions.map(
      (permission) => permission.name,
    )
    const token = await reply.jwtSign(
      {
        unitId: result.user.unitId,
        organizationId: result.user.organizationId,
        role: result.profile?.role?.name ?? userToken.role,
        permissions,
      },
      { sign: { sub: result.user.id } },
    )
    return reply.status(200).send({ ...result, token })
  }

  return reply.status(200).send(result)
}
