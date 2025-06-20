import { makeAuthenticateService } from '@/services/@factories/make-authenticate-service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { PermissionName, RoleName } from '@prisma/client'
import { z } from 'zod'

export interface UserToken {
  unitId: string
  organizationId: string
  role: RoleName
  sub: string
  permissions?: PermissionName[]
}

export const authenticate = async (
  request: FastifyRequest,
  replay: FastifyReply,
) => {
  const authenticateBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  })

  const { email, password } = authenticateBodySchema.parse(request.body)

  const authenticateService = makeAuthenticateService()

  const { user } = await authenticateService.execute({
    email,
    password,
  })
  const permissions: PermissionName[] | undefined =
    user.profile?.permissions.map((permission) => permission.name)
  const token = await replay.jwtSign(
    {
      unitId: user.unitId,
      organizationId: user.organizationId,
      role: user.profile?.role?.name,
      permissions,
    },
    { sign: { sub: user.id } },
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userWithoutPassword } = user
  const Roles = Object.values(RoleName) as readonly RoleName[]
  return replay.status(200).send({
    user: userWithoutPassword,
    roles: Roles,
    token,
  })
}
