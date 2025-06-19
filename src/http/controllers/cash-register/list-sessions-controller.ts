import { withErrorHandling } from '@/utils/http-error-handler'
import { makeListSessionsService } from '@/services/@factories/cash-register/make-list-sessions'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '../authenticate-controller'

export const ListSessionsController = withErrorHandling(async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const service = makeListSessionsService()
  const user = request.user as UserToken
  const { sessions } = await service.execute(user)
  return reply.status(200).send(sessions)
})
