import { FastifyRequest, FastifyReply } from 'fastify'
import { makeGetOpenCashSessionUseCase } from '@/modules/finance/infra/factories/make-get-open-cash-session'

export async function getOpenSessionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const useCase = makeGetOpenCashSessionUseCase()

  const { session } = await useCase.execute({
    unitId: request.user.unitId,
  })

  return reply.status(200).send(session)
}
