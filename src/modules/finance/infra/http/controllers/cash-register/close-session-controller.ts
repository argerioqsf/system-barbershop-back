import { makeCloseCashSessionUseCase } from '@/modules/finance/infra/factories/make-close-cash-session'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserToken } from '@/http/controllers/authenticate-controller'

export const CloseSessionController = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const useCase = makeCloseCashSessionUseCase()
  const unitId = (request.user as UserToken).unitId
  const { session } = await useCase.execute({ unitId })
  return reply.status(200).send(session)
}
