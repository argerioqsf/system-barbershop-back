import { makeSetUserUnitService } from '@/services/@factories/user/make-set-user-unit'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserToken } from './authenticate-controller'

export const SetUserUnitController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodySchema = z.object({ unitId: z.string() })
  const { unitId } = bodySchema.parse(request.body)
  const user = request.user as UserToken

  const service = makeSetUserUnitService()
  await service.execute({ user, unitId }, reply, request)

  return reply.status(200).send({})
}
