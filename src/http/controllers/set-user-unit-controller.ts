import { makeSetUserUnitService } from '@/services/@factories/user/make-set-user-unit'
import { UnitNotFoundError } from '@/services/@errors/unit-not-found-error'
import { UserNotFoundError } from '@/services/@errors/user-not-found-error'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UnitNotFromOrganizationError } from '@/services/users/set-user-unit'
import { UserToken } from './authenticate-controller'

export async function SetUserUnitController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({ unitId: z.string() })
  const { unitId } = bodySchema.parse(request.body)
  const user = request.user as UserToken

  try {
    const service = makeSetUserUnitService()
    await service.execute({ user, unitId })
  } catch (error) {
    if (
      error instanceof UnitNotFoundError ||
      error instanceof UserNotFoundError ||
      error instanceof UnitNotFromOrganizationError
    ) {
      return reply.status(400).send({ message: error.message })
    }
    throw error
  }

  const token = await reply.jwtSign(
    { unitId, organizationId: user.organizationId, role: user.role },
    { sign: { sub: user.sub } },
  )

  return reply.status(200).send({ token })
}
