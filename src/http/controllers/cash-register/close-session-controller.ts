import { makeCloseSessionService } from '@/services/@factories/cash-register/make-close-session'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'

export async function CloseSessionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const service = makeCloseSessionService()
  const unitId = (request.user as UserToken).unitId
  const { session } = await service.execute({ unitId })
  return reply.status(200).send(session)
}
