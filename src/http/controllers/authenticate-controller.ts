import { makeAuthenticateService } from '@/services/@factories/make-authenticate-service'
import { Role } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export interface UserToken {
  unitId: string
  organizationId: string
  role: Role
  sub: string
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

  const token = await replay.jwtSign(
    {
      unitId: user.unitId,
      organizationId: user.organizationId,
      role: user.profile?.role,
    },
    { sign: { sub: user.id } },
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userWithoutPassword } = user
  return replay.status(200).send({
    user: userWithoutPassword,
    roles: Role,
    token,
  })
}
