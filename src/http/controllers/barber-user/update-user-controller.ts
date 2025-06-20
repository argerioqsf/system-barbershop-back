import { makeUpdateUserService } from '@/services/@factories/barber-user/make-update-user'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { hasPermission } from '@/utils/permissions'
import { UserToken } from '../authenticate-controller'

export const UpdateBarberUserController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
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
  console.log('userToken: ', userToken)
  if (
    data.roleId ||
    (data.permissions &&
      hasPermission(['UPDATE_USER_ADMIN', 'UPDATE_USER_OWNER'], undefined))
  ) {
    return reply.status(403).send({ message: 'Unauthorized' })
  }
  const result = await service.execute({ id, ...data })

  // if (id === userToken.sub && (data.unitId || data.role)) {
  //   const token = await reply.jwtSign(
  //     {
  //       unitId: result.user.unitId,
  //       organizationId: result.user.organizationId,
  //       role: (result.profile as any)?.role?.name ?? userToken.role,
  //     },
  //     { sign: { sub: result.user.id } },
  //   )
  //   return reply.status(200).send({ ...result, token })
  // }

  return reply.status(200).send(result)
}
