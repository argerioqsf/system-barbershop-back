import { makeListCashSessionsUseCase } from '@/modules/finance/infra/factories/make-list-cash-sessions'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '@/http/controllers/authenticate-controller'

export const ListSessionsController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const useCase = makeListCashSessionsUseCase()
  const user = request.user as UserToken
  const { sessions } = await useCase.execute({ actor: user })
  return reply.status(200).send(sessions)
}
